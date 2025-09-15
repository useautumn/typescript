import {deleteFeature, deleteProduct, externalRequest} from './api.js';
import {initSpinner} from './utils.js';

export async function nukeCustomers(
	customers: {
		id: string;
		text: string;
	}[],
) {
	const s = initSpinner('Deleting customers');
	const total = customers.length;

	if (total === 0) {
		s.success('Customers deleted successfully!');
		return;
	}

	// Limit concurrent deletions to avoid overwhelming the API
	const concurrency = Math.max(
		1,
		Math.min(total, Number(process.env['ATM_DELETE_CONCURRENCY'] ?? 5) || 5),
	);

	let completed = 0;
	const updateSpinner = () => {
		s.text = `Deleting customers: ${completed} / ${total}`;
	};
	updateSpinner();

	for (let i = 0; i < total; i += concurrency) {
		const batch = customers.slice(i, i + concurrency);
		await Promise.all(
			batch.map(async customer => {
				try {
					await deleteCustomer(customer.id);
				} finally {
					completed++;
					updateSpinner();
				}
			}),
		);
	}

	s.success('Customers deleted successfully!');
}

async function deleteCustomer(id: string) {
	await externalRequest({
		method: 'DELETE',
		path: `/customers/${id}`,
	});
}

export async function nukeProducts(ids: string[]) {
	const s = initSpinner('Deleting products');
	for (const id of ids) {
		s.text = `Deleting product [${id}] ${ids.indexOf(id) + 1} / ${ids.length}`;
		await deleteProduct({id, allVersions: true});
	}
	s.success('Products deleted successfully!');
}

export async function nukeFeatures(ids: string[]) {
	const s = initSpinner('Deleting features');
	for (const id of ids) {
		s.text = `Deleting feature [${id}] ${ids.indexOf(id) + 1} / ${ids.length}`;
		await deleteFeature({id});
	}
	s.success('Features deleted successfully!');
}
