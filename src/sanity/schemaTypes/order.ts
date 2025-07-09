export default {
    name : 'order',
    type : 'document',
    title : 'Order',
    fields : [
        {
            name : 'firstName',
            type : 'string',
            title : 'First Name'
        },
        {
            name : 'lastName',
            type : 'string',
            title : 'Last Name'
        },
        {
            name : 'address',
            type : 'string',
            title : 'Address'
        },
        {
            name : 'city',
            type : 'string',
            title : 'City'
        },
        {
            name : 'email',
            type : 'string',
            title : 'Email'
        },
        {
            name : 'phone',
            type : 'string',
            title : 'Phone'
        },
        {
            name : 'zipCode',
            type : 'string',
            title : 'Zip Code'
        },
        {
            name : 'discount',
            type : 'number',
            title : 'Discount'
        },
        {
            name : 'cartItems',
            title : 'Cart Items',
            type : 'array',
            of : [{type : 'reference', to : {type : 'product'}}]
        },
        {
            name : 'total',
            type : 'number',
            title : 'Total'
        },
        {
            name : 'status',
            type : 'string',
            title : 'Order Status',
            options : {
                list : [
                    {title : 'Pending', value : 'pending'},
                    {title : 'Success', value : 'success'},
                    {title : 'Dispatch', value : 'dispatch'}
                ],
                layout : 'radio'
            },
            initialValue : 'pending'
        }
    ]
}