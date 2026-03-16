export function Input(id: string, placeholder: string, type="text") {

    return `
    <input id="${id}" type="${type}" placeholder="${placeholder}">
    `;

}