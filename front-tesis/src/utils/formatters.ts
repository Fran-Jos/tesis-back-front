import { FieldType } from "../config/entities";

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const decimalFormatter = new Intl.NumberFormat("es-EC", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatValue = (value: unknown, type?: FieldType | "enum" | "datetime" | "chip") => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  switch (type) {
    case "number":
      return Number(value).toLocaleString("es-EC");
    case "decimal":
      return decimalFormatter.format(Number(value));
    case "boolean":
      return value ? "Sí" : "No";
    case "date":
      return dateFormatter.format(new Date(value as string));
    case "datetime":
      return dateTimeFormatter.format(new Date(value as string));
    case "enum":
      return String(value)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    default:
      return String(value);
  }
};

export const parseValue = (value: string | number | boolean, type: FieldType) => {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case "number":
      return value === "" ? null : Number(value);
    case "decimal":
      return value === "" ? null : Number(value);
    case "boolean":
      if (typeof value === "string") {
        return value === "true";
      }
      return Boolean(value);
    default:
      return value;
  }
};
