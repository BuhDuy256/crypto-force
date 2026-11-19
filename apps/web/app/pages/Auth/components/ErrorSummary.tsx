import { FormAlert } from './FormAlert';

export interface SummaryError<Field extends string> {
  field: Field;
  label: string;
  message: string | undefined;
}

/** Lists every invalid field after a submit; choosing one moves focus to that field. */
export function ErrorSummary<Field extends string>({
  errors,
  onSelect,
}: {
  errors: (SummaryError<Field> | false | undefined)[];
  onSelect: (field: Field) => void;
}) {
  const items = errors.filter((error): error is SummaryError<Field> => !!error);
  if (items.length === 0) return null;
  return (
    <FormAlert tone="error" role="alert">
      <strong className="font-semibold">
        Fix {items.length} {items.length === 1 ? 'field' : 'fields'} to continue:
      </strong>
      <ul className="m-0 list-disc pl-5">
        {items.map((error) => (
          <li key={error.field}>
            <button
              type="button"
              onClick={() => {
                onSelect(error.field);
              }}
              className="min-h-7 text-left text-inherit underline underline-offset-3"
            >
              {error.label}: {error.message}
            </button>
          </li>
        ))}
      </ul>
    </FormAlert>
  );
}
