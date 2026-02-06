#!/usr/bin/env python3
"""
Convert Excalidraw diagrams to PDF using headless browser.
"""
import json
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


def extract_json_from_md(md_file):
    """Extract JSON data from Excalidraw markdown file."""
    content = Path(md_file).read_text()

    # Find JSON between ``` json and ``` markers
    pattern = r'```json\s*\n(.*?)\n```'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        raise ValueError(f"Could not find JSON data in {md_file}")

    json_str = match.group(1)
    return json.loads(json_str)


def render_excalidraw_to_pdf(json_data, output_pdf, html_template):
    """Render Excalidraw JSON to PDF using headless browser."""
    # Create HTML file with diagram data
    html_content = html_template.replace('%%DIAGRAM_DATA%%', json.dumps(json_data))

    temp_html = output_pdf.replace('.pdf', '_temp.html')
    Path(temp_html).write_text(html_content)

    with sync_playwright() as p:
        # Launch browser with larger viewport
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 2400, 'height': 1800})

        # Load the HTML file
        page.goto(f'file://{Path(temp_html).absolute()}')

        # Wait for rendering to complete
        page.wait_for_function("document.title === 'RENDER_COMPLETE'", timeout=15000)

        # Wait a bit more for full render
        page.wait_for_timeout(1500)

        # Export to PDF with larger format to avoid cutoff
        page.pdf(
            path=output_pdf,
            format='A2',
            landscape=True,
            print_background=True,
            margin={'top': '5mm', 'bottom': '5mm', 'left': '5mm', 'right': '5mm'},
            scale=0.8
        )

        browser.close()

        # Cleanup temp HTML
        Path(temp_html).unlink()

        print(f"✅ PDF saved: {output_pdf}")


def main():
    base_dir = Path(__file__).parent

    # Load HTML template
    html_template = (base_dir / 'render-diagram.html').read_text()

    diagrams = [
        {
            'md': base_dir / 'azure-openai-system-architecture.excalidraw.md',
            'pdf': base_dir / 'azure-openai-system-architecture.pdf'
        },
        {
            'md': base_dir / 'azure-openai-class-design.excalidraw.md',
            'pdf': base_dir / 'azure-openai-class-design.pdf'
        },
        {
            'md': base_dir / 'clawdbot-system-architecture.excalidraw.md',
            'pdf': base_dir / 'clawdbot-system-architecture.pdf'
        },
        {
            'md': base_dir / 'clawdbot-module-design.excalidraw.md',
            'pdf': base_dir / 'clawdbot-module-design.pdf'
        }
    ]

    for diagram in diagrams:
        print(f"\n📊 Converting {diagram['md'].name}...")
        try:
            json_data = extract_json_from_md(diagram['md'])
            render_excalidraw_to_pdf(json_data, str(diagram['pdf']), html_template)
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    print("\n🎉 All diagrams converted successfully!")


if __name__ == '__main__':
    main()
