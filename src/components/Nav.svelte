<script>
    import { link, location } from "svelte-spa-router";
</script>

<style>

</style>

<div class="ui huge menu">
    <a class="item" class:active={$location === '/'} href="/" use:link>
        transactions
    </a>
    <a
        class="item"
        class:active={$location === '/import'}
        href="/import"
        use:link>
        import
    </a>
    <a
        class="item"
        class:active={$location === '/reports'}
        href="/reports"
        use:link>
        reports
    </a>
    <div class="right menu" />
</div>
