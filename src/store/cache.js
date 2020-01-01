import { writable, derived } from 'svelte/store';

export const accounts = writable([]);
// export const transactions = writable([]);
export const transactionFilter = writable({
    text: '',
    accountId: '',
});
export const accountLabelById = derived(accounts, $accounts => {
    const obj = {};
    for (const account of $accounts) {
        obj[account.id] = account.label ? account.label : account.id;
    }
    return obj;
});
