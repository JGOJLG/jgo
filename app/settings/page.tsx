"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type ServiceCatalogItem = {
  id: number;
  name: string;
  description: string | null;
  default_price: number;
  is_active: boolean;
  display_order: number;
};

type ServiceFormState = {
  name: string;
  description: string;
  defaultPrice: string;
  isActive: boolean;
};

const emptyForm: ServiceFormState = {
  name: "",
  description: "",
  defaultPrice: "",
  isActive: true,
};

export default function SettingsPage() {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("service_catalog")
      .select(
        "id, name, description, default_price, is_active, display_order"
      )
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Unable to load services:", error);
      setErrorMessage(`Services could not be loaded: ${error.message}`);
      setLoading(false);
      return;
    }

    setServices((data ?? []) as ServiceCatalogItem[]);
    setLoading(false);
  }

  function startAddingService() {
    setEditingServiceId(null);
    setForm(emptyForm);
    setShowAddForm(true);
    setMessage("");
    setErrorMessage("");
  }

  function startEditingService(service: ServiceCatalogItem) {
    setShowAddForm(false);
    setEditingServiceId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      defaultPrice: String(service.default_price),
      isActive: service.is_active,
    });
    setMessage("");
    setErrorMessage("");
  }

  function cancelForm() {
    setEditingServiceId(null);
    setShowAddForm(false);
    setForm(emptyForm);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = form.name.trim();
    const price = Number(form.defaultPrice);

    if (!cleanName) {
      setErrorMessage("Please enter a service name.");
      return;
    }

    if (
      form.defaultPrice.trim() === "" ||
      Number.isNaN(price) ||
      price < 0
    ) {
      setErrorMessage("Please enter a valid default price.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    if (editingServiceId !== null) {
      const { error } = await supabase
        .from("service_catalog")
        .update({
          name: cleanName,
          description: form.description.trim() || null,
          default_price: price,
          is_active: form.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingServiceId);

      if (error) {
        console.error("Unable to update service:", error);
        setErrorMessage(`Service could not be updated: ${error.message}`);
        setSaving(false);
        return;
      }

      setMessage("Service updated successfully.");
    } else {
      const nextDisplayOrder =
        services.length === 0
          ? 1
          : Math.max(...services.map((service) => service.display_order)) + 1;

      const { error } = await supabase
        .from("service_catalog")
        .insert({
          name: cleanName,
          description: form.description.trim() || null,
          default_price: price,
          is_active: form.isActive,
          display_order: nextDisplayOrder,
        });

      if (error) {
        console.error("Unable to add service:", error);
        setErrorMessage(`Service could not be added: ${error.message}`);
        setSaving(false);
        return;
      }

      setMessage("Service added successfully.");
    }

    setEditingServiceId(null);
    setShowAddForm(false);
    setForm(emptyForm);
    setSaving(false);
    await loadServices();
  }

  async function toggleService(service: ServiceCatalogItem) {
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("service_catalog")
      .update({
        is_active: !service.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", service.id);

    if (error) {
      console.error("Unable to update service status:", error);
      setErrorMessage(
        `Service status could not be changed: ${error.message}`
      );
      return;
    }

    setMessage(
      `${service.name} is now ${service.is_active ? "inactive" : "active"}.`
    );

    await loadServices();
  }

  const formIsOpen = showAddForm || editingServiceId !== null;

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-[#243128]">
      <header className="border-b border-[#dfe6db] bg-[#fbfaf6] px-6 py-7 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#7f9975] hover:text-[#4d6247]"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#708075]">
                Manage the standard services and pricing used throughout
                JGO OS.
              </p>
            </div>

            <button
              type="button"
              onClick={startAddingService}
              className="rounded-xl bg-[#647d5b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4d6247]"
            >
              + Add Service
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 lg:p-10">
        {message ? (
          <div className="mb-5 rounded-xl bg-[#e7f1e6] px-4 py-3 text-sm font-semibold text-[#55704f]">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-5 rounded-xl border border-[#ead4d0] bg-[#fbefed] px-4 py-3 text-sm font-semibold text-[#9a554d]">
            {errorMessage}
          </div>
        ) : null}

        {formIsOpen ? (
          <form
            onSubmit={handleSubmit}
            className="mb-8 overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm"
          >
            <div className="border-b border-[#e4e9df] px-6 py-5 lg:px-8">
              <h2 className="text-xl font-bold">
                {editingServiceId !== null
                  ? "Edit Service"
                  : "Add New Service"}
              </h2>

              <p className="mt-1 text-sm text-[#708075]">
                This price will be the default for new client services.
                You can still change the price for an individual client.
              </p>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-2 lg:p-8">
              <FormField label="Service Name">
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: LinkedIn Optimization"
                  className={inputStyle}
                />
              </FormField>

              <FormField label="Default Price">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#708075]">
                    $
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.defaultPrice}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        defaultPrice: event.target.value,
                      }))
                    }
                    className={`${inputStyle} pl-8`}
                  />
                </div>
              </FormField>

              <div className="lg:col-span-2">
                <FormField label="Description">
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Briefly describe what is included."
                    className={`${inputStyle} resize-y`}
                  />
                </FormField>
              </div>

              <div className="lg:col-span-2">
                <label className="flex items-center gap-3 rounded-2xl border border-[#dfe6db] bg-[#fbfcf9] p-4">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#647d5b]"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#3d4d39]">
                      Active service
                    </p>

                    <p className="mt-1 text-xs text-[#849080]">
                      Active services will appear when adding a new client
                      service.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9df] bg-[#fbfcf9] px-6 py-5 sm:flex-row sm:justify-end lg:px-8">
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className="rounded-xl border border-[#d7e1d0] bg-white px-5 py-3 text-sm font-semibold text-[#4d6247] hover:bg-[#f5f7f2] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#647d5b] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4d6247] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingServiceId !== null
                    ? "Save Changes"
                    : "Add Service"}
              </button>
            </div>
          </form>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-[#dfe6db] bg-white shadow-sm">
          <div className="border-b border-[#e4e9df] px-6 py-5 lg:px-8">
            <h2 className="text-xl font-bold">Services & Pricing</h2>

            <p className="mt-1 text-sm text-[#708075]">
              These are the standard prices used when creating new client
              services.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-sm font-semibold text-[#708075]">
              Loading services...
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-[#3d4d39]">
                No services have been added yet.
              </p>

              <p className="mt-2 text-sm text-[#849080]">
                Add your first service to begin building your pricing
                catalog.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e7ece3]">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col gap-5 px-6 py-5 transition hover:bg-[#fafbf8] sm:flex-row sm:items-center sm:justify-between lg:px-8"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#344331]">
                        {service.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          service.is_active
                            ? "bg-[#e7f1e6] text-[#55704f]"
                            : "bg-[#f0f1ee] text-[#7d847a]"
                        }`}
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#708075]">
                      {service.description || "No description added."}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <p className="mr-2 text-lg font-bold text-[#4d6247]">
                      ${Number(service.default_price).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits:
                            Number(service.default_price) % 1 === 0 ? 0 : 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => startEditingService(service)}
                      className="rounded-lg border border-[#d7e1d0] bg-white px-3 py-2 text-xs font-semibold text-[#4d6247] hover:bg-[#f3f6f0]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleService(service)}
                      className="rounded-lg border border-[#dfe3dc] bg-white px-3 py-2 text-xs font-semibold text-[#6f776c] hover:bg-[#f4f5f2]"
                    >
                      {service.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle =
  "w-full rounded-xl border border-[#d7e1d0] bg-[#fbfcf9] px-4 py-3 text-sm text-[#243128] outline-none placeholder:text-[#9aa59c] focus:border-[#9fb294] focus:ring-2 focus:ring-[#e8eee3]";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#3d4d39]">
        {label}
      </span>

      <div className="mt-2">{children}</div>
    </label>
  );
}
