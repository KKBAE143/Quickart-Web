import ProductModel from "../models/product.model.js";

export const createProductController = async(request,response)=>{
    try {
        const { 
            name ,
            image ,
            category,
            subCategory,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
        } = request.body 

        if(!name || !image[0] || !category[0] || !subCategory[0] || !unit || !price || !description ){
            return response.status(400).json({
                message : "Enter required fields",
                error : true,
                success : false
            })
        }

        const product = new ProductModel({
            name ,
            image ,
            category,
            subCategory,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
        })
        const saveProduct = await product.save()

        return response.json({
            message : "Product Created Successfully",
            data : saveProduct,
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductController = async(request,response)=>{
    try {
        
        let { page, limit, search } = request.body 

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data,totalCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit).populate('category subCategory'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            totalCount : totalCount,
            totalNoPage : Math.ceil( totalCount / limit),
            data : data
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategory = async(request,response)=>{
    try {
        const { id } = request.body 

        if(!id){
            return response.status(400).json({
                message : "provide category id",
                error : true,
                success : false
            })
        }

        const product = await ProductModel.find({ 
            category : { $in : id }
        }).limit(15)

        return response.json({
            message : "category product list",
            data : product,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategoryAndSubCategory  = async(request,response)=>{
    try {
        const { categoryId,subCategoryId,page,limit } = request.body

        if(!categoryId || !subCategoryId){
            return response.status(400).json({
                message : "Provide categoryId and subCategoryId",
                error : true,
                success : false
            })
        }

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = {
            category : { $in :categoryId  },
            subCategory : { $in : subCategoryId }
        }

        const skip = (page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product list",
            data : data,
            totalCount : dataCount,
            page : page,
            limit : limit,
            success : true,
            error : false
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductDetails = async(request,response)=>{
    try {
        const { productId } = request.body 

        const product = await ProductModel.findOne({ _id : productId })


        return response.json({
            message : "product details",
            data : product,
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update product
export const updateProductDetails = async(request,response)=>{
    try {
        const { _id } = request.body 

        if(!_id){
            return response.status(400).json({
                message : "provide product _id",
                error : true,
                success : false
            })
        }

        // Define allowed fields for update to prevent invalid data
        const allowedFields = [
            'name',
            'image',
            'category',
            'subCategory',
            'unit',
            'stock',
            'price',
            'discount',
            'description',
            'more_details',
            'publish'
        ];

        // Build update object with only allowed fields
        const updateData = {};
        allowedFields.forEach(field => {
            if (request.body[field] !== undefined) {
                updateData[field] = request.body[field];
            }
        });

        const updateProduct = await ProductModel.updateOne({ _id : _id }, updateData)

        return response.json({
            message : "updated successfully",
            data : updateProduct,
            error : false,
            success : true
        })

    } catch (error) {
        // Handle MongoDB ObjectId cast errors with better messages
        if (error.name === 'CastError') {
            return response.status(400).json({
                message : `Invalid ${error.path}: "${error.value}" is not a valid ID. Please check your category/subcategory IDs.`,
                error : true,
                success : false
            })
        }
        
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//delete product
export const deleteProductDetails = async(request,response)=>{
    try {
        const { _id } = request.body 

        if(!_id){
            return response.status(400).json({
                message : "provide _id ",
                error : true,
                success : false
            })
        }

        const deleteProduct = await ProductModel.deleteOne({_id : _id })

        return response.json({
            message : "Delete successfully",
            error : false,
            success : true,
            data : deleteProduct
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//search product
export const searchProduct = async(request,response)=>{
    try {
        let { search, page , limit } = request.body 

        if(!page){
            page = 1
        }
        if(!limit){
            limit  = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = ( page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt  : -1 }).skip(skip).limit(limit).populate('category subCategory'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            data : data,
            totalCount :dataCount,
            totalPage : Math.ceil(dataCount/limit),
            page : page,
            limit : limit 
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

// Enhanced search with advanced filters and sorting
export const getProductsWithFilters = async(request, response) => {
    try {
        let {
            search,
            page,
            limit,
            minPrice,
            maxPrice,
            brands,
            minRating,
            inStockOnly,
            minDiscount,
            categoryId,
            subCategoryId,
            sortBy
        } = request.body;

        // Default pagination
        if (!page) page = 1;
        if (!limit) limit = 10;

        // Build query - don't filter by publish if products don't have this field set
        let query = {};

        // Search query - only add if search term is provided
        if (search && search.trim()) {
            query.$text = { $search: search.trim() };
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
        }

        // Brand filter (stored in more_details.brand)
        if (brands && brands.length > 0) {
            query['more_details.brand'] = { $in: brands };
        }

        // Rating filter
        if (minRating !== undefined) {
            query['review_stats.average_rating'] = { $gte: Number(minRating) };
        }

        // Stock availability filter
        if (inStockOnly === true || inStockOnly === 'true') {
            query.stock = { $gt: 0 };
        }

        // Discount filter
        if (minDiscount !== undefined) {
            query.discount = { $gte: Number(minDiscount) };
        }

        // Category filter
        if (categoryId && categoryId.length > 0) {
            query.category = { $in: Array.isArray(categoryId) ? categoryId : [categoryId] };
        }

        // SubCategory filter
        if (subCategoryId && subCategoryId.length > 0) {
            query.subCategory = { $in: Array.isArray(subCategoryId) ? subCategoryId : [subCategoryId] };
        }

        // Sorting
        console.log('📊 Backend received sortBy:', sortBy);
        let sortOptions = {};
        switch (sortBy) {
            case 'price_low_high':
                sortOptions = { price: 1 };
                console.log('✅ Sorting by price LOW to HIGH');
                break;
            case 'price_high_low':
                sortOptions = { price: -1 };
                console.log('✅ Sorting by price HIGH to LOW');
                break;
            case 'rating_high_low':
                sortOptions = { 'review_stats.average_rating': -1, 'review_stats.total_reviews': -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            case 'best_selling':
                sortOptions = { purchase_count: -1, view_count: -1 };
                break;
            case 'discount_high_low':
                sortOptions = { discount: -1 };
                break;
            case 'relevance':
            default:
                // If search query, sort by text score, otherwise by creation date
                if (search && search.trim()) {
                    sortOptions = { score: { $meta: "textScore" } };
                } else {
                    sortOptions = { createdAt: -1 };
                }
                console.log('✅ Sorting by relevance/createdAt');
                break;
        }
        console.log('🔍 Sort options applied:', sortOptions);

        const skip = (page - 1) * limit;

        // Execute query
        let productQuery = ProductModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .populate('category subCategory');

        // Add text score for relevance sorting
        if (search && search.trim() && sortBy === 'relevance') {
            productQuery = productQuery.select({ score: { $meta: "textScore" } });
        }

        const [data, dataCount] = await Promise.all([
            productQuery,
            ProductModel.countDocuments(query)
        ]);

        // Log sorted results
        if (data.length > 0) {
            console.log('🎯 First 3 products after sort:', data.slice(0, 3).map(p => ({
                name: p.name.substring(0, 30),
                price: p.price
            })));
        }

        return response.json({
            message: "Product data with filters",
            error: false,
            success: true,
            data: data,
            totalCount: dataCount,
            totalPage: Math.ceil(dataCount / limit),
            page: Number(page),
            limit: Number(limit),
            filters: {
                search,
                minPrice,
                maxPrice,
                brands,
                minRating,
                inStockOnly,
                minDiscount,
                categoryId,
                subCategoryId,
                sortBy
            }
        });

    } catch (error) {
        console.error('❌ getProductsWithFilters error:', error.message);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get all unique brands
export const getAllBrands = async(request, response) => {
    try {
        // Get all unique brands from more_details.brand field
        const brands = await ProductModel.distinct('more_details.brand', { 
            publish: true,
            'more_details.brand': { $exists: true, $ne: null, $ne: '' }
        });

        return response.json({
            message: "Brands list",
            error: false,
            success: true,
            data: brands.sort() // Sort alphabetically
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get price range (min and max)
export const getPriceRange = async(request, response) => {
    try {
        const result = await ProductModel.aggregate([
            { $match: { publish: true, price: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" }
                }
            }
        ]);

        const priceRange = result.length > 0 ? result[0] : { minPrice: 0, maxPrice: 10000 };

        return response.json({
            message: "Price range",
            error: false,
            success: true,
            data: {
                minPrice: priceRange.minPrice || 0,
                maxPrice: priceRange.maxPrice || 10000
            }
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};