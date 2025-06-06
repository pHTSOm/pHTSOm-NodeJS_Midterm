// product-service/config/db.js
const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

const initializeDatabase = async () => {
  try {
    // Import models relevant to this service
    const Product = require("../models/Product");
    const ProductVariant = require("../models/ProductVariant");
    const Review = require("../models/Review");

    // Define associations for this service
    Product.hasMany(ProductVariant, {
      foreignKey: "productId",
      onDelete: "CASCADE",
    });
    ProductVariant.belongsTo(Product, { foreignKey: "productId" });

    Product.hasMany(Review, { foreignKey: "productId", onDelete: "CASCADE" });
    Review.belongsTo(Product, { foreignKey: "productId" });

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created directory: ${uploadsDir}`);
    }

    // Sync models with the database
    await sequelize.sync({ alter: true });
    console.log("Product service models synced with database");
    
    await seedProductData();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

// Add this function to your db.js file
const seedProductData = async () => {
  try {
    ensureUploadsDirectory();
    const Product = require("../models/Product");
    const ProductVariant = require("../models/ProductVariant");
    
    // Log the number of existing products
    const existingCount = await Product.count();
    console.log(`Current product count in database: ${existingCount}`);
    
    // Skip seeding if products already exist
    if (existingCount > 0) {
      console.log("Database already contains products, skipping seed");
      return;
    }

    // Create sample computer components
    const products = [
      {
        productName: "AMD Ryzen 7 5800X",
        shortDesc: "High-performance 8-core, 16-thread desktop processor",
        description:
          "The AMD Ryzen 7 5800X is a high-performance desktop processor with 8 cores and 16 threads. Built on AMD's 7nm process, it delivers exceptional gaming and multitasking performance. With a base clock of 3.8GHz and boost up to 4.7GHz, it's perfect for gamers and content creators alike. The processor features 36MB of combined cache and supports PCIe 4.0.",
        price: 349.99,
        category: "CPU",
        brand: "AMD",
        stock: 25,
        isNew: true,
        isBestSeller: true,
        tags: "processor,ryzen,amd",
        imgUrl: JSON.stringify([
          "/uploads/products/amd-ryzen-7-5800x-1.png",
          "/uploads/products/amd-ryzen-7-5800x-2.png",
          "/uploads/products/amd-ryzen-7-5800x-3.png",
        ]),
      },
      {
        productName: "NVIDIA GeForce RTX 3080",
        shortDesc: "Ultimate gaming GPU with 10GB GDDR6X memory",
        description:
          "The NVIDIA GeForce RTX 3080 is built on the Ampere architecture, delivering amazing performance for gamers and creators. It features 8704 CUDA cores, 10GB of GDDR6X memory, and 2nd gen ray tracing cores for incredible visual fidelity. With DLSS AI acceleration and NVIDIA Reflex technology, this card delivers the ultimate gaming experience at high resolutions with high frame rates.",
        price: 699.99,
        category: "GPU",
        brand: "NVIDIA",
        stock: 15,
        isNew: true,
        isBestSeller: true,
        tags: "graphics,nvidia,gpu,rtx",
        imgUrl: JSON.stringify([
          "/uploads/products/nvidia-rtx-3080-1.png",
          "/uploads/products/nvidia-rtx-3080-2.png",
          "/uploads/products/nvidia-rtx-3080-3.png",
        ]),
      },
      {
        productName: "Samsung 980 PRO SSD 1TB",
        shortDesc: "PCIe 4.0 NVMe SSD with blazing fast performance",
        description:
          "The Samsung 980 PRO is a high-performance PCIe 4.0 NVMe SSD designed for tech enthusiasts and hardcore gamers. With sequential read speeds up to 7,000 MB/s and write speeds up to 5,000 MB/s, it delivers twice the data transfer rate of PCIe 3.0 SSDs. The drive features Samsung's custom Elpis controller and V-NAND technology for reliable performance and endurance.",
        price: 149.99,
        category: "Storage",
        brand: "Samsung",
        stock: 50,
        isNew: true,
        isBestSeller: false,
        tags: "storage,ssd,nvme,samsung",
        imgUrl: JSON.stringify([
          "/uploads/products/samsung-980-pro-ssd-1.png",
          "/uploads/products/samsung-980-pro-ssd-2.png",
          "/uploads/products/samsung-980-pro-ssd-3.png",
        ]),
      },
      {
        productName: "Corsair Vengeance RGB PRO 32GB",
        shortDesc: "High-performance DDR4 RAM with dynamic RGB lighting",
        description:
          "Corsair Vengeance RGB PRO series DDR4 memory lights up your PC with mesmerizing dynamic multi-zone RGB lighting, while delivering the best in performance. Optimized for maximum bandwidth and tight response times on the latest Intel and AMD DDR4 motherboards, the Vengeance RGB PRO series provides the best performance and stability for overclocking enthusiasts.",
        price: 159.99,
        category: "Memory",
        brand: "Corsair",
        stock: 40,
        isNew: false,
        isBestSeller: true,
        tags: "memory,ram,ddr4,corsair",
        imgUrl: JSON.stringify([
          "/uploads/products/corsair-vengeance-rgb-pro-1.png",
          "/uploads/products/corsair-vengeance-rgb-pro-2.png",
          "/uploads/products/corsair-vengeance-rgb-pro-3.png",
        ]),
      },
      {
        productName: "ASUS ROG Strix B550-F Gaming",
        shortDesc: "High-performance AMD B550 ATX gaming motherboard",
        description:
          "The ROG Strix B550-F Gaming motherboard delivers a feature-rich design with robust power solution and comprehensive cooling controls for AMD Ryzen CPUs. It includes Intel 2.5 Gb Ethernet, USB 3.2 Gen 2 Type-C, and ROG SupremeFX audio. The board also features AI Noise-Cancelling Microphone technology and Aura Sync RGB lighting for a customized gaming setup.",
        price: 189.99,
        category: "Motherboard",
        brand: "ASUS",
        stock: 20,
        isNew: false,
        isBestSeller: false,
        tags: "motherboard,amd,asus,rog",
        imgUrl: JSON.stringify([
          "/uploads/products/asus-rog-strix-b550-f-1.png",
          "/uploads/products/asus-rog-strix-b550-f-2.png",
        ]),
      },
      {
        productName: "Dell XPS 13 (2023)",
        shortDesc: "Ultra-thin premium laptop with InfinityEdge display",
        description:
          "The Dell XPS 13 is an ultraportable laptop that combines premium design with powerful performance. Featuring Intel's latest generation processors, a stunning 13.4-inch InfinityEdge display with minimal bezels, and a precision-crafted aluminum chassis, the XPS 13 delivers an exceptional computing experience. The laptop boasts a comfortable, backlit keyboard, a responsive glass touchpad, and impressive battery life of up to 12 hours. With Thunderbolt 4 connectivity, Wi-Fi 6 compatibility, and enhanced thermal design, the XPS 13 is perfect for professionals, students, and anyone seeking a premium computing experience in a compact form factor.",
        price: 1299.99,
        category: "Laptop",
        brand: "Dell",
        stock: 30,
        isNew: true,
        isBestSeller: true,
        tags: "laptop,dell,xps,ultrabook,premium",
        imgUrl: JSON.stringify([
          "/uploads/products/dell-xps-13-1.jpg",
          "/uploads/products/dell-xps-13-2.jpg",
          "/uploads/products/dell-xps-13-3.jpg",
        ]),
      },
    ];
    
    console.log(`Starting to seed ${products.length} products...`);
    
    // Create placeholder images for products if they don't exist
    createPlaceholderImages(products);
    
    // Create products and their variants
    for (const productData of products) {
      try {
        console.log(`Creating product: ${productData.productName} (${productData.category})`);
        const product = await Product.create(productData);
        console.log(`Successfully created product #${product.id}: ${product.productName}`);
        
        // Create variants based on product category
        await createVariantsForProduct(product, ProductVariant);
        
        console.log(`Created variants for ${product.productName}`);
      } catch (error) {
        console.error(`Error creating product ${productData.productName}:`, error);
      }
    }
    
    console.log("Product seeding completed successfully");
  } catch (error) {
    console.error("Error seeding product data:", error);
  }
};

// Helper functions
const ensureUploadsDirectory = () => {
  const uploadsDir = path.join(__dirname, '../public/uploads/products');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created directory: ${uploadsDir}`);
  }
};

const createPlaceholderImages = (products) => {
  // Create a simple placeholder image if needed
  const placeholderPath = path.join(__dirname, '../public/placeholder.png');
  if (!fs.existsSync(placeholderPath)) {
    // Create an empty file as placeholder
    fs.writeFileSync(placeholderPath, '');
    console.log("Created placeholder image file");
  }

  // Ensure product image directories exist
  for (const product of products) {
    try {
      const images = JSON.parse(product.imgUrl);
      for (const imagePath of images) {
        const fullPath = path.join(__dirname, '../public', imagePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(fullPath)) {
          // Copy placeholder to the image path
          fs.copyFileSync(placeholderPath, fullPath);
          console.log(`Created placeholder image at ${fullPath}`);
        }
      }
    } catch (error) {
      console.error(`Error creating image for ${product.productName}:`, error);
    }
  }
};

const createVariantsForProduct = async (product, ProductVariant) => {
  let skuCounter = product.id * 1000;
  
  switch (product.category) {
    case "CPU":
      await ProductVariant.create({
        productId: product.id,
        name: "Base Model",
        description: "Default configuration",
        additionalPrice: 0,
        stock: Math.floor(product.stock * 0.6),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "OC Edition",
        description: "Factory overclocked for better performance",
        additionalPrice: 49.99,
        stock: Math.floor(product.stock * 0.4),
        sku: skuCounter++,
      });
      break;
      
    case "GPU":
      await ProductVariant.create({
        productId: product.id,
        name: "Standard Edition",
        description: "Reference design",
        additionalPrice: 0,
        stock: Math.ceil(product.stock * 0.5),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "OC Edition",
        description: "Overclocked with enhanced cooling",
        additionalPrice: 79.99,
        stock: Math.ceil(product.stock * 0.3),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "Liquid Cooled",
        description: "Integrated AIO liquid cooling for maximum performance",
        additionalPrice: 149.99,
        stock: Math.ceil(product.stock * 0.2),
        sku: skuCounter++,
      });
      break;
      
    case "Storage":
      await ProductVariant.create({
        productId: product.id,
        name: "1TB",
        description: "Standard 1TB capacity",
        additionalPrice: 0,
        stock: Math.ceil(product.stock * 0.6),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "2TB",
        description: "Expanded 2TB capacity",
        additionalPrice: 100.0,
        stock: Math.ceil(product.stock * 0.4),
        sku: skuCounter++,
      });
      break;
      
    case "Memory":
      await ProductVariant.create({
        productId: product.id,
        name: "32GB (2x16GB) 3200MHz",
        description: "Standard speed dual-channel kit",
        additionalPrice: 0,
        stock: Math.ceil(product.stock * 0.4),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "32GB (2x16GB) 3600MHz",
        description: "High-speed dual-channel kit",
        additionalPrice: 29.99,
        stock: Math.ceil(product.stock * 0.6),
        sku: skuCounter++,
      });
      break;
      
    case "Motherboard":
      await ProductVariant.create({
        productId: product.id,
        name: "Standard Edition",
        description: "Basic configuration with standard warranty",
        additionalPrice: 0,
        stock: Math.ceil(product.stock * 0.7),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "Premium Bundle",
        description: "Includes premium accessories and extended warranty",
        additionalPrice: 39.99,
        stock: Math.ceil(product.stock * 0.3),
        sku: skuCounter++,
      });
      break;
      
    case "Laptop":
      await ProductVariant.create({
        productId: product.id,
        name: "Core i5 / 8GB / 256GB",
        description: "Intel Core i5-1240P, 8GB LPDDR5, 256GB SSD, FHD+ Display",
        additionalPrice: 0,
        stock: Math.ceil(product.stock * 0.5),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "Core i7 / 16GB / 512GB",
        description: "Intel Core i7-1260P, 16GB LPDDR5, 512GB SSD, FHD+ Display",
        additionalPrice: 400.0,
        stock: Math.ceil(product.stock * 0.3),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "Core i7 / 32GB / 1TB",
        description: "Intel Core i7-1260P, 32GB LPDDR5, 1TB SSD, UHD+ Touch Display",
        additionalPrice: 800.0,
        stock: Math.ceil(product.stock * 0.2),
        sku: skuCounter++,
      });
      break;
      
    default:
      // Generic variants for other product types
      await ProductVariant.create({
        productId: product.id,
        name: "Basic Edition",
        description: "Standard configuration",
        additionalPrice: 0,
        stock: Math.floor(product.stock * 0.6),
        sku: skuCounter++,
      });

      await ProductVariant.create({
        productId: product.id,
        name: "Deluxe Edition",
        description: "Enhanced features and premium support",
        additionalPrice: 49.99,
        stock: Math.floor(product.stock * 0.4),
        sku: skuCounter++,
      });
  }
};

module.exports = { sequelize, testConnection, initializeDatabase };