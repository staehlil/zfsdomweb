<template>
  <DataTable :value="rows" :empty="empty" :mapEnums="mapEnums" :mapIcons="mapIcons" :responsiveLayout="responsiveLayout" stripedRows :class="'sticky-table flex flex-column'+(fullscreenTable ? ' flex-grow-1 fullscreen-table' : '')"
            v-model:filters="mapFilters" filterDisplay="menu" v-model:selection="selectedRows" @row-select="onSelectionChange" @row-unselect="onSelectionChange" @row-select-all="onSelectAll()" @row-unselect-all="onSelectAll(false)"
            :loading="loading" loading-icon="pi pi-sync text-8xl" :paginator="pagination" :rows="getSavedPaginatorRows() || 20" :rowsPerPageOptions="[10,20,50,rows.length-(rows.length%100)+100]" :page-link-size="5"
            rowGroupMode="rowspan" :groupRowsBy="groupRowsBy" @row-click="onRowClick($event)" :row-class="rowClass" @row-reorder="onRowReorder" @page="onPagination">
    <Column :row-reorder="true" v-if="reorderRows"></Column>
    <Column :selectionMode="selectionMode" v-if="selectionMode!=='none'" :class="selectionMode==='none' ? 'hide' : ''"></Column>
    <Column v-for="col of listColumns" :field="col.field" :header="col.header" :key="col.field" :sortable="col.sortable" :hidden="col.hidden">
      <template #body="{data,field}" v-if="mapEnums[col.field]">{{mapEnums[field][data[field]]||""}}</template>
      <template #body="{data,field}" v-else-if="mapIcons[col.field]">
        <span :class="(mapIcons[field][(data[field]+'').replace(/^(\d+).*$/g,'$1')] || {}).icon||''" :title="(mapIcons[field][data[field]] || {}).title||''">&nbsp;</span>
        <span>{{(data[field]+'').replace(/^\d+/g,'')}}</span>
      </template>
    </Column>
    <Column bodyStyle="text-align: right" v-for="button of buttons" :key="button.icon" class="column-button">
      <template #body="slotProps">
        <div class="flex flex-row justify-content-end">
          <Button v-if="!button.condition || button.condition(slotProps.data)" :label="button.label" :class="button.class||'p-button-rounded p-button-plain p-button-text p-button-lg'" @click="button.onClick(slotProps.data)">
            <div class="flex flex-column align-items-center justify-content-center">
              <span :class="'p-button-icon p-button-icon-left mr-0 '+(button.iconDataProp ? slotProps.data[button.iconDataProp]||button.icon : button.icon)" data-pc-section="icon"></span>
              <span class="p-button-label text-xs" data-pc-section="label">{{button.label}}</span>
            </div>
          </Button>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
<script>
import { FilterMatchMode } from "primevue/api";

export default {
  name: "TableComponent",
  emits:["update:selected", "row-clicked", "row-reordered"],
  data() {
    return {
      mapFilters:{},
      selectedRows:null,
      mapColumns:{},
      listColumns:[]
    }
  },
  watch: {
    props(newValue) {
      this.mapFilters.global.value = newValue.search;
    }
  },
  props: {
    rows:{
      type:Array,
      default:[]
    },
    columns:{
      type:Object,
      default(){
        return {}
      }
    },
    filters:{
      type:Object,
      default(){
        return {
          global: {value: null, matchMode: FilterMatchMode.CONTAINS}
        }
      }
    },
    selected:null,
    selectionMode:{
      type:String,
      default:"none"
    },
    buttons:{
      type:Array,
      default:()=>[]
    },
    displayAllColumns:{
      type:Boolean,
      default:false
    },
    loading:Boolean,
    fullscreenTable:{
      type:Boolean,
      default:false
    },
    search:String,
    pagination:Boolean,
    groupRowsBy:String,
    rowClass:Function,
    mapEnums:{
      type:Object,
      default:()=>{return {}}
    },
    mapIcons:{
      type:Object,
      default:()=>{return {}}
    },
    reorderRows:{
      type:Boolean,
      default:false
    },
    empty: {
      type:String,
      default:"Keine Einträge gefunden"
    },
    responsiveLayout: {
      type:String,
      default:"scroll"
    },
    label: {
      type:String,
      default:"default"
    }
  },
  setup(props) {
    return {props}
  },
  created() {
    this.mapFilters = this.props.filters;
    this.mapColumns = this.props.columns;
    this.listColumns = this.getColumns(this.rows);
    this.mapFilters.global.value = this.props.search;
  },
  methods:{
    getColumns(data,mapColumns=this.mapColumns) {
      let columns = [];
      if (this.props.displayAllColumns) {
        for (let key in data[0]) {
            columns.push({field:key,header:mapColumns[key]||key,hidden:mapColumns[key]===null,sortable:true});
        }
      }
      else {
        for (let key in mapColumns) {
          columns.push({field:key,header:mapColumns[key]||key,hidden:mapColumns[key]===null,sortable:true});
        }
      }
      return columns;
    },
    onSelectionChange() {
      this.$emit("update:selected",this.selectedRows);
      this.$emit("selectionChange",this.selectedRows);
    },
    onSelectAll(select=true) {
      let selected = select ? this.rows : [];
      this.$emit("update:selected",selected);
      this.$emit("selectionChange",selected);
    },
    onRowClick(event) {
      this.$emit("row-clicked",event.data);
    },
    onRowReorder(event) {
      this.$emit("row-reordered",event);
    },
    onPagination(event) {
      if (event.rows)
        localStorage.setItem(this.label+"PaginatorRows",event.rows);
    },
    getSavedPaginatorRows() {
      return parseInt(localStorage.getItem(this.label+"PaginatorRows"));
    }
  }
};
</script>