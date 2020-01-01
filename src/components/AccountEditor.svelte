<script>
    const ipc = require("electron").ipcRenderer

    export let account = null

    let accountLabel
    let accountBalance
    let accountBalanceDate

    $: if (account != null) {
        initValues()
    }

    function initValues() {
        accountLabel = account.label ? account.label : ""
        accountBalance = account.balance ? account.balance : 0
        accountBalanceDate = moment().format("YYYY-MM-DD")

        if (account.balanceDate) {
            accountBalanceDate = moment(account.balanceDate).format(
                "YYYY-MM-DD"
            )
        }
    }

    function saveChanges() {
        const values = {
            ...account,
            label: accountLabel,
        }
        if (isValidBalance(accountBalance)) {
            values.balance = accountBalance
            values.balanceDate = convertToDate(accountBalanceDate)
        }
        ipc.send("update_account", values)
        account = null
    }

    function discardChanges() {
        account = null
    }

    function isValidBalance(balance) {
        const test = +balance
        return !isNaN(test)
    }

    function convertToDate(date) {
        const d = moment(date, "DD/MM/YYYY")
        if (!d.isValid()) {
            return new Date()
        }
        return d.toDate()
    }

    $: if (account != null) {
        jQuery(".ui.modal").modal("show")
    }
</script>

<style>

</style>

<div class="ui modal">
    <div class="header">Account {account ? account.id : ''}</div>
    <div class="content">
        <form class="ui form">
            <div class="field">
                <label>Label</label>
                <input
                    type="text"
                    name="label"
                    placeholder="label"
                    bind:value={accountLabel} />
            </div>
            <div class="field">
                <label>Balance</label>
                <div class="ui left labeled input">
                    <label for="balance" class="ui label">$</label>
                    <input
                        type="text"
                        name="balance"
                        placeholder="balance"
                        bind:value={accountBalance} />
                </div>
            </div>
            <div class="field">
                <label>Balance Date</label>
                <div class="ui calendar" id="balanceDateCalendar">
                    <div class="ui input left icon">
                        <i class="calendar icon" />
                        <input
                            type="date"
                            placeholder="Date"
                            bind:value={accountBalanceDate} />
                    </div>
                </div>
            </div>
        </form>
    </div>
    <div class="actions">
        <button class="ui black deny button" on:click={discardChanges}>
            Cancel
        </button>
        <button
            class="ui positive right labeled icon button"
            on:click={saveChanges}>
            Save Changes
            <i class="checkmark icon" />
        </button>
    </div>
</div>
