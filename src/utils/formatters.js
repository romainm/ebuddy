import moment from 'moment';

export function formatDate(value) {
    if (value) {
        value = moment(value).format('DD/MM/YY');
    }
    return value;
}

export function formatMoney(value) {
    return toMoney(value);
}

export function toMoney(amount) {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

export function accountFormatter(cell, formatterParams) {
    let value = cell.getValue();
    if (value) {
        value = formatterParams.accountNameById[value];
    }

    return value;
}
