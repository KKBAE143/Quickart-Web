export const valideURLConvert = (name)=>{
    if (!name) return '';
    
    // Replace special characters that cause URI malformed errors
    const url = name.toString()
        .replaceAll(" ", "-")      // Space to dash
        .replaceAll(",", "-")      // Comma to dash
        .replaceAll("&", "-")      // Ampersand to dash
        .replaceAll("%", "")       // Remove percent signs (cause URI malformed)
        .replaceAll("(", "")       // Remove parentheses
        .replaceAll(")", "")       // Remove parentheses
        .replaceAll("/", "-")      // Slash to dash
        .replaceAll("\\", "-")     // Backslash to dash
        .replaceAll("?", "")       // Remove question marks
        .replaceAll("=", "-")      // Equals to dash
        .replaceAll("+", "-")      // Plus to dash
        .replaceAll("#", "")       // Remove hash
        .replaceAll("--", "-")     // Double dash to single
        .replaceAll("--", "-");    // Again for triple+ dashes
    
    return url;
}