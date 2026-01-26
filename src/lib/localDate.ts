const pad = (value: number) => value.toString().padStart(2, "0");

const toDate = (input?: Date | number | string): Date => {
    if (input instanceof Date) return input;
    if (input == null) return new Date();
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date input");
    }
    return date;
};

export function formatLocalDateTime(input?: Date | number | string): string {
    const date = toDate(input);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatLocalDate(input?: Date | number | string): string {
    const date = toDate(input);
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    return `${year}-${month}-${day}`;
}
