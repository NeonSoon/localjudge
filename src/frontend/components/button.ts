export function Button(id: string, text: string, className: string) {
    
    return `
    <button id="${id}" class="${className}">
    ${text}
    </button>
    `;

}