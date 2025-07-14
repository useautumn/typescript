export function snakeCaseToCamelCase(value: string) {
    return value.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}