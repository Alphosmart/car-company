"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminGate from "@/components/admin/AdminGate";
import { formatNaira } from "@/lib/api";

type CarItem = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  fuelType: string;
  transmission: string;
  color: string;
  description?: string | null;
  status: string;
  photos: string[];
  featured: boolean;
  createdAt: string;
};

type CarFormState = {
  make: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  condition: string;
  fuelType: string;
  transmission: string;
  color: string;
  description: string;
  status: string;
  featured: boolean;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const emptyForm: CarFormState = {
  make: "",
  model: "",
  year: "",
  price: "",
  mileage: "0",
  condition: "used",
  fuelType: "petrol",
  transmission: "automatic",
  color: "",
  description: "",
  status: "available",
  featured: false,
};

export default function AdminCarsPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [cars, setCars] = useState<CarItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<CarFormState>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editablePhotos, setEditablePhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const existingToken =
      window.localStorage.getItem("token") || window.localStorage.getItem("authToken") || "";

    setToken(existingToken);
  }, []);

  const loadCars = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/cars?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load cars (${response.status})`);
      }

      const payload = (await response.json()) as { cars?: CarItem[] };
      setCars(payload.cars || []);
      setSelectedIds([]);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to load inventory";
      setError(text);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadCars();
  }, [token, loadCars]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const editId = searchParams.get("edit");

    if (mode === "new") {
      startCreate();
      return;
    }

    if (editId && cars.length > 0) {
      const match = cars.find((item) => item.id === editId);
      if (match) startEdit(match);
    }
  }, [cars, searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    const active = cars.find((car) => car.id === selectedId);
    if (active) {
      setEditablePhotos(active.photos || []);
    }
  }, [cars, selectedId]);

  function startCreate() {
    setSelectedId(null);
    setForm(emptyForm);
    setEditablePhotos([]);
    setPhotoFiles([]);
    setMessage(null);
  }

  function startEdit(car: CarItem) {
    setSelectedId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: String(car.year),
      price: String(car.price),
      mileage: String(car.mileage),
      condition: car.condition,
      fuelType: car.fuelType,
      transmission: car.transmission,
      color: car.color,
      description: car.description || "",
      status: car.status,
      featured: car.featured,
    });
    setEditablePhotos(car.photos || []);
    setMessage(null);
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= editablePhotos.length) return;

    setEditablePhotos((previous) => {
      const copy = [...previous];
      const [target] = copy.splice(index, 1);
      copy.splice(newIndex, 0, target);
      return copy;
    });
  }

  async function savePhotoOrder() {
    if (!selectedId) return;

    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/cars/${selectedId}/photos`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photos: editablePhotos }),
      });

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payloadError?.error || "Failed to save photo order");
      }

      setMessage("Photo order saved.");
      await loadCars();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to save photo order";
      setError(text);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  }

  async function uploadSelectedPhotos() {
    if (!selectedId || photoFiles.length === 0) return;

    setUploadingPhotos(true);
    setError(null);

    try {
      const formData = new FormData();
      photoFiles.forEach((file) => formData.append("photos", file));

      const response = await fetch(`${API_BASE}/api/cars/${selectedId}/photos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payloadError?.error || "Failed to upload photos");
      }

      setPhotoFiles([]);
      setEditablePhotos([]);
      setMessage("Photos uploaded successfully.");
      await loadCars();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to upload photos";
      setError(text);
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      ...form,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      featured: form.featured,
    };

    try {
      const response = await fetch(
        selectedId ? `${API_BASE}/api/cars/${selectedId}` : `${API_BASE}/api/cars`,
        {
          method: selectedId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payloadError?.error || "Failed to save car");
      }

      setMessage(selectedId ? "Car updated successfully." : "Car created successfully.");
      setForm(emptyForm);
      setSelectedId(null);
      await loadCars();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to save car";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCar(id: string) {
    if (!window.confirm("Delete this car listing?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/cars/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete car");
      }

      await loadCars();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to delete car";
      setError(text);
    }
  }

  async function markSold(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/cars/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "sold" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadCars();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Failed to update status";
      setError(text);
    }
  }

  async function bulkMarkSold() {
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map((id) => markSold(id)));
    setSelectedIds([]);
  }

  async function bulkDelete() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected listings?`)) return;
    await Promise.all(selectedIds.map((id) => deleteCar(id)));
    setSelectedIds([]);
  }

  return (
    <AdminGate>
      <div className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Create, edit, and manage car listings from a single screen.
            </p>
          </div>
          <Link href="/cars" className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">
            View Public Inventory
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{selectedId ? "Edit Car" : "Add New Car"}</h2>
              <button
                type="button"
                onClick={startCreate}
                className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold"
              >
                New Listing
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <Input label="Make" value={form.make} onChange={(value) => setForm({ ...form, make: value })} required />
              <Input label="Model" value={form.model} onChange={(value) => setForm({ ...form, model: value })} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Year" type="number" value={form.year} onChange={(value) => setForm({ ...form, year: value })} required />
                <Input label="Price" type="number" value={form.price} onChange={(value) => setForm({ ...form, price: value })} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Mileage" type="number" value={form.mileage} onChange={(value) => setForm({ ...form, mileage: value })} />
                <Input label="Color" value={form.color} onChange={(value) => setForm({ ...form, color: value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Condition" value={form.condition} onChange={(value) => setForm({ ...form, condition: value })} options={["new", "used"]} />
                <Select label="Fuel Type" value={form.fuelType} onChange={(value) => setForm({ ...form, fuelType: value })} options={["petrol", "diesel", "hybrid", "electric"]} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Transmission" value={form.transmission} onChange={(value) => setForm({ ...form, transmission: value })} options={["automatic", "manual"]} />
                <Select label="Status" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={["available", "reserved", "sold"]} />
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => setForm({ ...form, featured: event.target.checked })}
                />
                Featured on homepage
              </label>

              <label className="grid gap-1 text-sm font-semibold">
                Upload photos (Cloudinary)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))}
                  className="rounded-lg border border-black/15 px-3 py-2 font-normal"
                />
              </label>
              <button
                type="button"
                onClick={uploadSelectedPhotos}
                disabled={!selectedId || photoFiles.length === 0 || uploadingPhotos}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {uploadingPhotos ? "Uploading..." : "Upload Photos"}
              </button>
              {!selectedId ? (
                <p className="text-xs text-ink-muted">Save the listing first, then upload photos.</p>
              ) : null}

              {selectedId && editablePhotos.length > 0 ? (
                <div className="rounded-lg border border-black/10 p-3">
                  <p className="text-sm font-semibold">Photo order</p>
                  <div className="mt-2 grid gap-2">
                    {editablePhotos.map((photo, index) => (
                      <div key={`${photo}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 p-2">
                        <span className="truncate text-xs text-ink-muted">{photo}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => movePhoto(index, -1)} className="rounded border border-black/15 px-2 py-1 text-xs">Up</button>
                          <button type="button" onClick={() => movePhoto(index, 1)} className="rounded border border-black/15 px-2 py-1 text-xs">Down</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={savePhotoOrder} className="mt-2 rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold">
                    Save Photo Order
                  </button>
                </div>
              ) : null}

              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {message ? <p className="text-sm text-green-700">{message}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : selectedId ? "Update Car" : "Create Car"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-black/10 bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Current Listings</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={bulkMarkSold} disabled={selectedIds.length === 0} className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold disabled:opacity-60">
                  Mark Selected Sold
                </button>
                <button type="button" onClick={bulkDelete} disabled={selectedIds.length === 0} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">
                  Delete Selected
                </button>
                <button type="button" onClick={loadCars} className="rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold">
                  Refresh
                </button>
              </div>
            </div>

            {loading ? <p className="mt-4 text-sm text-ink-muted">Loading cars...</p> : null}
            {!loading && cars.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No cars available yet.</p>
            ) : null}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-ink-muted">
                    <th className="py-2">
                      <input
                        type="checkbox"
                        checked={cars.length > 0 && selectedIds.length === cars.length}
                        onChange={(event) => {
                          setSelectedIds(event.target.checked ? cars.map((car) => car.id) : []);
                        }}
                      />
                    </th>
                    <th className="py-2">Car</th>
                    <th className="py-2">Price</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cars.map((car) => (
                    <tr key={car.id} className="border-b border-black/5 align-top">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(car.id)}
                          onChange={() => toggleSelected(car.id)}
                        />
                      </td>
                      <td className="py-3">
                        <p className="font-semibold">
                          {car.year} {car.make} {car.model}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {car.condition} • {car.fuelType} • {car.transmission}
                        </p>
                      </td>
                      <td className="py-3">{formatNaira(car.price)}</td>
                      <td className="py-3 capitalize">{car.status}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(car)}
                            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => markSold(car.id)}
                            className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold"
                          >
                            Mark Sold
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCar(car.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminGate>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-black/15 px-3 py-2 font-normal"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-black/15 px-3 py-2 font-normal"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
