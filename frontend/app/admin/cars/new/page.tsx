import { redirect } from "next/navigation";

export default function AdminNewCarPage() {
  redirect("/admin/cars?mode=new");
}
