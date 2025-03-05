<template>
  <div class="flex flex-column min-h-full justify-content-center">
    <div class="flex flex-row flex-wrap justify-content-center align-items-start">
      <a v-for="entry of listEntries" v-bind:key="entry.url" @click.prevent="$router.push(entry.url)">
        <Card class="mx-0 my-2 sm:m-3 p-3 toc-card">
          <template #header>
            <i :class="entry.icon" class="text-xxl"></i>
          </template>
          <template #title>
            <div class="text-3xl">{{entry.title}}</div>
          </template>
          <template #content>
          </template>
        </Card>
      </a>
    </div>
  </div>
</template>
<script>
export default {
  name: "TocComponent",
  props: {
    listEntries:Array
  }
};
</script>