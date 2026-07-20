"use client";

import {
  archiveClient,
  deleteClientPermanently,
  restoreClient,
} from "./actions";

type Props = {
  clientId: number;
  clientName: string;
  isArchived: boolean;
};

export default function ClientActions({
  clientId,
  clientName,
  isArchived,
}: Props) {
  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `Delete ${clientName} permanently? This cannot be undone.`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <>
      {isArchived ? (
        <form action={restoreClient}>
          <input type="hidden" name="clientId" value={clientId} />

          <button
            type="submit"
            className="rounded-xl border border-[#cbd8c4] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2]"
          >
            Restore Client
          </button>
        </form>
      ) : (
        <form action={archiveClient}>
          <input type="hidden" name="clientId" value={clientId} />

          <button
            type="submit"
            className="rounded-xl border border-[#d8cdb8] bg-white px-5 py-3 text-sm font-semibold text-[#80633b] hover:bg-[#faf6ee]"
          >
            Archive Client
          </button>
        </form>
      )}

      <form action={deleteClientPermanently} onSubmit={confirmDelete}>
        <input type="hidden" name="clientId" value={clientId} />

        <button
          type="submit"
          className="rounded-xl border border-[#e2c6c2] bg-white px-5 py-3 text-sm font-semibold text-[#9a554d] hover:bg-[#fbefed]"
        >
          Delete Permanently
        </button>
      </form>
    </>
  );
}