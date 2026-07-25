import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name : {
        type : String,
    },
    image : {
        type : Array,
        default : []
    },
    category : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'category'
        }
    ],
    subCategory : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'subCategory'
        }
    ],
    unit : {
        type : String,
        default : ""
    },
    stock : {
        type : Number,
        default : null
    },
    price : {
        type : Number,
        defualt : null
    },
    discount : {
        type : Number,
        default : null
    },
    description : {
        type : String,
        default : ""
    },
    more_details : {
        type : Object,
        default : {}
    },
    publish : {
        type : Boolean,
        default : true
    },
    // Review statistics
    review_stats : {
        total_reviews : {
            type : Number,
            default : 0
        },
        average_rating : {
            type : Number,
            default : 0,
            min : 0,
            max : 5
        },
        rating_distribution : {
            five_star : {
                type : Number,
                default : 0
            },
            four_star : {
                type : Number,
                default : 0
            },
            three_star : {
                type : Number,
                default : 0
            },
            two_star : {
                type : Number,
                default : 0
            },
            one_star : {
                type : Number,
                default : 0
            }
        }
    },
    // Analytics for recommendations
    view_count : {
        type : Number,
        default : 0
    },
    purchase_count : {
        type : Number,
        default : 0
    }
},{
    timestamps : true
})

//create a text index
productSchema.index({
    name  : "text",
    description : 'text'
},{
    name : 10,
    description : 5
})


const ProductModel = mongoose.model('product',productSchema)

export default ProductModel