import { render } from "../../lib/tui/ink-compat.js";
import { TemplateSelector } from "../../views/react/template/TemplateSelector.js";

export function testTemplateCommand() {
	render(<TemplateSelector />);
}
