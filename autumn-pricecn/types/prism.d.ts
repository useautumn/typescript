declare module "prismjs/components/prism-core" {
  const Prism: {
    highlight: (code: string, grammar: any, language?: string) => string;
    languages: {
      [key: string]: any;
    };
  };
  export = Prism;
}

declare module "prismjs/components/prism-clike" {}
declare module "prismjs/components/prism-javascript" {}
declare module "prism-themes/themes/prism-vsc-dark-plus.css" {
  const content: any;
  export default content;
}
