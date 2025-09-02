import { deleteFeature, deleteProduct, externalRequest } from "./api.js";
import { initSpinner } from "./utils.js";

export async function nukeCustomers(customers: {
    id: string;
    text: string;
}[]) {
    const s = initSpinner("Deleting customers");
    for (const customer of customers) {
        s.text = `Deleting customer: ${customer.id} (${customers.indexOf(customer) + 1} / ${customers.length})`;
        await deleteCustomer(customer.id);
    }
    s.success("Customers deleted successfully!");
}

async function deleteCustomer(id: string) {
    await externalRequest({
        method: "DELETE",
        path: `/customers/${id}`,
    });
}

export async function nukeProducts(ids: string[]) {
    const s = initSpinner("Deleting products");
    for (const id of ids) {
        s.text = `Deleting product [${id}] ${ids.indexOf(id) + 1} / ${ids.length}`;
        await deleteProduct(id);
    }
    s.success("Products deleted successfully!");
}

export async function nukeFeatures(ids: string[]) {
    const s = initSpinner("Deleting features");
    for (const id of ids) {
        s.text = `Deleting feature [${id}] ${ids.indexOf(id) + 1} / ${ids.length}`;
        await deleteFeature(id);
    }
    s.success("Features deleted successfully!");
}