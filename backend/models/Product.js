const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id:{
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    productName:{
        type:DataTypes.STRING,
        allowNull: false
    },
    shortDesc: { 
        type: DataTypes.STRING,
        allowNull: false 
    },
    description:{
        type:DataTypes.TEXT,
        allowNull: false
    },
    price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    category:{
        type:DataTypes.STRING,
        allowNull: false
    },
    brand:{
      type:DataTypes.STRING,
      allowNull: false  
    },
    stock:{
        type:DataTypes.INTEGER,
        defaultValue: 0
    },
    imgUrl:{
        type:DataTypes.JSON,
        allowNull: true
    },
    variantData:{
        type:DataTypes.STRING,
        allowNull: true
    },
    tags:{
        type:DataTypes.STRING,
        allowNull: true
    },
    avgRating:{
        type:DataTypes.FLOAT,
        defaultValue: 0
    },
    salesCount:{
        type:DataTypes.INTEGER,
        defaultValue: 0
    },
    isNew:{
        type:DataTypes.BOOLEAN,
        defaultValue: false
    },
    isBestSeller:{
        type:DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = Product;