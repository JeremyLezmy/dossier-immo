import { createContext, useContext, useState } from "react";

interface DisclosureState {
  readonly openById: Readonly<Record<string, boolean>>;
  readonly setOpen: (id: string, open: boolean) => void;
}

const EditorDisclosureContext = createContext<DisclosureState | undefined>(
  undefined,
);

export function EditorDisclosureProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [openById, setOpenById] = useState<Readonly<Record<string, boolean>>>(
    {},
  );
  const setOpen = (id: string, open: boolean) => {
    setOpenById((current) =>
      current[id] === open ? current : { ...current, [id]: open },
    );
  };
  return (
    <EditorDisclosureContext.Provider value={{ openById, setOpen }}>
      {children}
    </EditorDisclosureContext.Provider>
  );
}

export function EditorDisclosure({
  disclosureId,
  className = "editor-subsection",
  children,
}: {
  readonly disclosureId: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  const state = useContext(EditorDisclosureContext);
  if (!state) {
    throw new Error(
      "EditorDisclosure doit être rendu dans EditorDisclosureProvider.",
    );
  }
  return (
    <details
      className={className}
      data-disclosure-id={disclosureId}
      open={state.openById[disclosureId] ?? false}
      onToggle={(event) =>
        state.setOpen(disclosureId, event.currentTarget.open)
      }
    >
      {children}
    </details>
  );
}
