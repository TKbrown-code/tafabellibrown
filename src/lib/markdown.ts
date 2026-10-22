type MarkdownNode = {
  type: string;
  depth?: number;
  children?: MarkdownNode[];
};

export function shiftMarkdownHeadingLevels() {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (node.type === "heading" && typeof node.depth === "number") {
        node.depth = Math.min(node.depth + 1, 6);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
