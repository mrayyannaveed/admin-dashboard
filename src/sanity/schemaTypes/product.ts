export default {
  name: 'product',
  type: 'document',
  title: 'Product',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'name'
      },
    },
    {
      name : 'description',
      type : 'string',
      title : 'Description'
    },
    {
      name : 'category',
      type : 'string',
      title : 'Category'
    },
    {
      name: 'image',
      type: "image",
      title: 'Image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'price',
      type: 'number',
      title: 'Price',
    },
    {
      name: 'stock',
      type: 'number',
      title: 'Stock',
    },
    {
      name: 'tag',
      type: 'string',
      title: 'Tag',
    },
  ]
}