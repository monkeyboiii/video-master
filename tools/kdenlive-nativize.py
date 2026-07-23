#!/usr/bin/env python3
"""Repair lightweight cli-anything-kdenlive MLT so Kdenlive opens it cleanly.

Root cause this fixes:
  cli-anything-kdenlive exports lightweight MLT, not a fully native Kdenlive
  project. Kdenlive can flag those files as corrupt/invalid because:
    1. the root <mlt producer="kdenlive-cli"> points at no real producer;
    2. bin producers are named clipN and timeline entries reference clipN;
    3. those producers often lack unique numeric kdenlive:id properties;
    4. vertical projects may keep a non-vertical display/sample aspect.

This script is intentionally mechanical. It does not change track organization,
clip order, clip timing, media paths, effects, or transitions. It only rewires
the internal IDs and validates that links resolve.

Typical agent workflow:
  python3 tools/kdenlive-nativize.py media/DBX-APP-S01E002/founder-story.kdenlive --vertical
  python3 tools/kdenlive-nativize.py media/DBX-APP-S01E002/founder-story.kdenlive --check

Use --dry-run to preview changes and --backup to keep <file>.bak before writing.
"""

from __future__ import annotations

import argparse
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path


ROOT_PLACEHOLDER = "kdenlive-cli"
DEFAULT_TRACTOR = "maintractor"


@dataclass
class Report:
    path: Path
    changed: bool = False
    renamed_ids: dict[str, str] = field(default_factory=dict)
    added_kdenlive_ids: int = 0
    replaced_kdenlive_ids: int = 0
    root_before: str | None = None
    root_after: str | None = None
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    producers: int = 0
    entries: int = 0
    unique_kdenlive_ids: int = 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mechanically repair cli-anything-kdenlive MLT exports for Kdenlive.",
    )
    parser.add_argument("projects", nargs="+", type=Path, help=".kdenlive/.mlt file(s) to repair")
    parser.add_argument(
        "--vertical",
        action="store_true",
        help="force 1080x1920-style square-pixel 9:16 profile metadata",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate and report needed fixes without writing",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="show what would change without writing",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="write <file>.bak before modifying a project",
    )
    parser.add_argument(
        "--start-id",
        type=int,
        default=1,
        help="first numeric kdenlive:id to use when assigning missing IDs",
    )
    return parser.parse_args(argv)


def indent(tree: ET.ElementTree) -> None:
    try:
        ET.indent(tree, space="  ")
    except AttributeError:
        pass


def is_media_producer(element: ET.Element) -> bool:
    return element.tag in {"producer", "chain"}


def all_id_elements(root: ET.Element) -> list[ET.Element]:
    return [element for element in root.iter() if element.get("id")]


def all_media_producers(root: ET.Element) -> list[ET.Element]:
    return [element for element in root.iter() if is_media_producer(element) and element.get("id")]


def producer_refs(root: ET.Element) -> list[str]:
    refs: list[str] = []
    for element in root.iter():
        ref = element.get("producer")
        if ref:
            refs.append(ref)
    return refs


def find_property(element: ET.Element, name: str) -> ET.Element | None:
    for child in list(element):
        if child.tag == "property" and child.get("name") == name:
            return child
    return None


def insert_property_after_resource(element: ET.Element, name: str, value: str) -> ET.Element:
    prop = ET.Element("property", {"name": name})
    prop.text = value

    children = list(element)
    insert_at = 0
    for index, child in enumerate(children):
        if child.tag == "property" and child.get("name") == "resource":
            insert_at = index + 1
            break
    element.insert(insert_at, prop)
    return prop


def next_available_id(used: set[int], start: int) -> int:
    value = max(1, start)
    while value in used:
        value += 1
    used.add(value)
    return value


def rename_clip_ids(root: ET.Element, report: Report) -> None:
    id_map: dict[str, str] = {}
    existing_ids = {element.get("id") for element in all_id_elements(root)}

    for element in all_media_producers(root):
        old_id = element.get("id")
        if not old_id or not old_id.startswith("clip"):
            continue
        suffix = old_id[4:]
        if not suffix.isdigit():
            continue

        base = f"producer{suffix}"
        new_id = base
        counter = 1
        while new_id in existing_ids and new_id != old_id:
            new_id = f"{base}_{counter}"
            counter += 1

        element.set("id", new_id)
        existing_ids.discard(old_id)
        existing_ids.add(new_id)
        id_map[old_id] = new_id

    if not id_map:
        return

    for element in root.iter():
        ref = element.get("producer")
        if ref in id_map:
            element.set("producer", id_map[ref])

    report.renamed_ids.update(id_map)
    report.changed = True


def repair_root_producer(root: ET.Element, report: Report) -> None:
    ids = {element.get("id") for element in all_id_elements(root)}
    report.root_before = root.get("producer")

    if root.get("producer") == ROOT_PLACEHOLDER and DEFAULT_TRACTOR in ids:
        root.set("producer", DEFAULT_TRACTOR)
        report.changed = True

    report.root_after = root.get("producer")


def repair_kdenlive_ids(root: ET.Element, report: Report, start_id: int) -> None:
    used: set[int] = set()

    for value in Counter(list_kdenlive_id_values(root)):
        if value.isdigit():
            used.add(int(value))

    for producer in all_media_producers(root):
        prop = find_property(producer, "kdenlive:id")
        value = (prop.text or "").strip() if prop is not None and prop.text else ""
        valid_unique = value.isdigit() and list_kdenlive_id_values(root).count(value) == 1

        if valid_unique:
            continue

        new_value = str(next_available_id(used, start_id))
        if prop is None:
            insert_property_after_resource(producer, "kdenlive:id", new_value)
            report.added_kdenlive_ids += 1
        else:
            prop.text = new_value
            report.replaced_kdenlive_ids += 1
        report.changed = True


def list_kdenlive_id_values(root: ET.Element) -> list[str]:
    values: list[str] = []
    for producer in all_media_producers(root):
        prop = find_property(producer, "kdenlive:id")
        if prop is not None and prop.text:
            values.append(prop.text.strip())
    return values


def repair_vertical_profile(root: ET.Element, report: Report) -> None:
    profile = root.find("profile")
    if profile is None:
        report.warnings.append("missing <profile>; cannot set vertical aspect metadata")
        return

    desired = {
        "sample_aspect_num": "1",
        "sample_aspect_den": "1",
        "display_aspect_num": "9",
        "display_aspect_den": "16",
    }
    for key, value in desired.items():
        if profile.get(key) != value:
            profile.set(key, value)
            report.changed = True


def validate(root: ET.Element, path: Path, report: Report) -> None:
    ids = {element.get("id") for element in all_id_elements(root)}
    refs = producer_refs(root)
    media = all_media_producers(root)
    kdenlive_ids = list_kdenlive_id_values(root)

    report.producers = len(media)
    report.entries = sum(1 for element in root.iter() if element.tag == "entry")
    report.unique_kdenlive_ids = len(set(kdenlive_ids))

    root_ref = root.get("producer")
    if root_ref and root_ref not in ids:
        report.errors.append(f"root producer does not resolve: {root_ref}")

    unresolved = sorted({ref for ref in refs if ref not in ids})
    if unresolved:
        report.errors.append(f"unresolved producer references: {', '.join(unresolved)}")

    if len(kdenlive_ids) != len(set(kdenlive_ids)):
        report.errors.append("duplicate kdenlive:id values")

    for producer in media:
        producer_id = producer.get("id", "<unknown>")
        kdenlive_id = find_property(producer, "kdenlive:id")
        value = (kdenlive_id.text or "").strip() if kdenlive_id is not None and kdenlive_id.text else ""
        if not value.isdigit():
            report.errors.append(f"{producer_id} has no numeric kdenlive:id")

        resource = find_property(producer, "resource")
        if resource is not None and resource.text:
            media_path = (path.parent / resource.text).resolve()
            if not media_path.exists():
                report.errors.append(f"{producer_id} missing resource: {resource.text}")


def repair_project(path: Path, *, vertical: bool, start_id: int) -> tuple[ET.ElementTree, Report]:
    report = Report(path=path)
    tree = ET.parse(path)
    root = tree.getroot()

    rename_clip_ids(root, report)
    repair_root_producer(root, report)
    repair_kdenlive_ids(root, report, start_id)
    if vertical:
        repair_vertical_profile(root, report)
    validate(root, path, report)

    return tree, report


def print_report(report: Report, *, check: bool, dry_run: bool) -> None:
    mode = "check" if check else "dry-run" if dry_run else "write"
    status = "changed" if report.changed else "unchanged"
    print(f"{report.path}: {status} ({mode})")
    print(
        f"  root={report.root_after} producers={report.producers} "
        f"entries={report.entries} unique_kdenlive_ids={report.unique_kdenlive_ids}"
    )
    if report.renamed_ids:
        print(f"  renamed_ids={len(report.renamed_ids)}")
    if report.added_kdenlive_ids or report.replaced_kdenlive_ids:
        print(
            f"  kdenlive_ids added={report.added_kdenlive_ids} "
            f"replaced={report.replaced_kdenlive_ids}"
        )
    for warning in report.warnings:
        print(f"  warning: {warning}")
    for error in report.errors:
        print(f"  error: {error}")


def write_project(tree: ET.ElementTree, path: Path, *, backup: bool) -> None:
    if backup:
        shutil.copy2(path, path.with_suffix(path.suffix + ".bak"))
    indent(tree)
    tree.write(path, encoding="utf-8", xml_declaration=True, short_empty_elements=False)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    failed = False

    for project in args.projects:
        try:
            tree, report = repair_project(project, vertical=args.vertical, start_id=args.start_id)
        except ET.ParseError as exc:
            print(f"{project}: error: XML parse failed: {exc}", file=sys.stderr)
            failed = True
            continue
        except OSError as exc:
            print(f"{project}: error: {exc}", file=sys.stderr)
            failed = True
            continue

        print_report(report, check=args.check, dry_run=args.dry_run)

        if report.errors or (args.check and report.changed):
            failed = True

        if report.changed and not args.check and not args.dry_run:
            write_project(tree, project, backup=args.backup)

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
