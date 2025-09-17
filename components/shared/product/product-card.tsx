"use client"

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IProductInput } from "@/types";
import Rating from "./rating";
import { formatNumber, generateId, round2 } from "@/lib/utils";
import ProductPrice from "./product-price";
import ImageHover from "./image-hover";
import { Eye } from "lucide-react";
import useCartStore from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/hooks/use-loading";

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
  showColorSelector = false,
  horizontalLayout = false,
}: {
  product: IProductInput & { id: string };
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
  showColorSelector?: boolean;
  horizontalLayout?: boolean;
}) => {
  const [selectedColor, setSelectedColor] = React.useState<string | null>(null);
  
  // Function to get actual color value for display
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      // English colors
      'White': '#ffffff',
      'Black': '#000000',
      'Red': '#ff0000',
      'Blue': '#0000ff',
      'Green': '#008000',
      'Yellow': '#ffff00',
      'Orange': '#ffa500',
      'Purple': '#800080',
      'Pink': '#ffc0cb',
      'Brown': '#a52a2a',
      'Gray': '#808080',
      'Silver': '#c0c0c0',
      'Gold': '#ffd700',
      'Navy': '#000080',
      'Maroon': '#800000',
      'Teal': '#008080',
      'Lime': '#00ff00',
      'Cyan': '#00ffff',
      'Magenta': '#ff00ff',
      'Beige': '#f5f5dc',
      'Cream': '#fffdd0',
      'Ivory': '#fffff0',
      'Tan': '#d2b48c',
      'Khaki': '#f0e68c',
      'Olive': '#808000',
      'Turquoise': '#40e0d0',
      'Coral': '#ff7f50',
      'Salmon': '#fa8072',
      'Lavender': '#e6e6fa',
      'Mint': '#f5fffa',
      'Rose': '#ff69b4',
      'Indigo': '#4b0082',
      'Violet': '#8a2be2',
      'Aqua': '#00ffff',
      'Lime Green': '#32cd32',
      'Forest Green': '#228b22',
      'Royal Blue': '#4169e1',
      'Sky Blue': '#87ceeb',
      'Hot Pink': '#ff69b4',
      'Deep Pink': '#ff1493',
      'Crimson': '#dc143c',
      'Dark Red': '#8b0000',
      'Dark Blue': '#00008b',
      'Dark Green': '#006400',
      'Dark Gray': '#a9a9a9',
      'Light Gray': '#d3d3d3',
      'Light Blue': '#add8e6',
      'Light Green': '#90ee90',
      'Light Pink': '#ffb6c1',
      'Light Yellow': '#ffffe0',
      'Dark Brown': '#654321',
      'Light Brown': '#d2b48c',
      'Burgundy': '#800020',
      'Wine': '#722f37',
      'Charcoal': '#36454f',
      'Slate': '#708090',
      'Steel Blue': '#4682b4',
      'Powder Blue': '#b0e0e6',
      'Peach': '#ffcba4',
      'Apricot': '#fbceb1',
      'Melon': '#fdbcb4',
      'Lemon': '#fff700',
      'Banana': '#ffe135',
      'Strawberry': '#fc5a8d',
      'Cherry': '#de3163',
      'Grape': '#6f2da8',
      'Plum': '#dda0dd',
      'Berry': '#8b008b',
      'Cranberry': '#dc143c',
      'Raspberry': '#e30b5d',
      'Blackberry': '#4d0135',
      'Blueberry': '#4f86f7',
      'Watermelon': '#fc6c85',
      'Mango': '#ff8243',
      'Papaya': '#ffefd5',
      'Pineapple': '#f4e4bc',
      'Coconut': '#f5f5dc',
      'Almond': '#efdecd',
      'Hazelnut': '#b5651d',
      'Walnut': '#773f1a',
      'Pecan': '#a0522d',
      'Chestnut': '#954535',
      'Mahogany': '#c04000',
      'Oak': '#daa520',
      'Pine': '#01796f',
      'Cedar': '#4a5d23',
      'Birch': '#f7f7f7',
      'Maple': '#d2691e',
      'Cherry Wood': '#a0522d',
      'Rosewood': '#65000b',
      'Ebony': '#555d50',
      'Ash': '#b2beb5',
      'Beech': '#f5f5dc',
      'Poplar': '#f0f8ff',
      'Willow': '#f7f7f7',
      'Bamboo': '#f0e68c',
      'Rattan': '#daa520',
      'Wicker': '#f5deb3',
      'Cane': '#d2b48c',
      'Reed': '#f0e68c',
      'Straw': '#f4e4bc',
      'Hay': '#f0e68c',
      'Wheat': '#f5deb3',
      
      // Arabic colors
      'أسود': '#000000',
      'أبيض': '#ffffff',
      'بني': '#8B4513',
      'أزرق': '#0000ff',
      'أخضر': '#008000',
      'أحمر': '#ff0000',
      'وردي': '#ffc0cb',
      'بنفسجي': '#800080',
      'برتقالي': '#ffa500',
      'أصفر': '#ffff00',
      'رمادي': '#808080',
      'فضي': '#c0c0c0',
      'ذهبي': '#ffd700',
      'شفاف': '#ffffff',
      'متعدد الألوان': '#ff6b6b',
      
      // Common variations
      'white': '#ffffff',
      'black': '#000000',
      'red': '#ff0000',
      'blue': '#0000ff',
      'green': '#008000',
      'yellow': '#ffff00',
      'orange': '#ffa500',
      'purple': '#800080',
      'pink': '#ffc0cb',
      'brown': '#a52a2a',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#c0c0c0',
      'gold': '#ffd700',
    };
    
    return colorMap[colorName] || colorName;
  };
  
  const ProductImage = ({ isHorizontal = false }: { isHorizontal?: boolean } = {}) => {
    // Use the same simple approach as ProductGallery - no complex error handling
    const imageSrc = product.images?.[0] || 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image'

    return (
      <div className={`relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center ${
        isHorizontal 
          ? 'h-full w-full' // Full size for horizontal layout (50% width, 100% height)
          : 'h-24 w-24 md:h-48 md:w-full sm:md:h-56 lg:md:h-64' // Normal size
      }`}>
        {product.images && product.images.length > 1 && !isHorizontal ? (
              <ImageHover
            src={imageSrc}
            hoverSrc={product.images[1] || imageSrc}
                alt={product.name}
              />
            ) : (
              <Image
            src={imageSrc}
                alt={product.name}
                fill
            sizes={isHorizontal ? "50vw" : "(max-width: 768px) 96px, (max-width: 1200px) 50vw, 33vw"}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority={false}
          />
        )}
        {/* Sale Badge - only show on larger images */}
        {!isHorizontal && product.listPrice > product.price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {Math.round(((product.listPrice - product.price) / product.listPrice) * 100)}% خصم
          </div>
        )}
        {/* Stock Badge - only show on larger images */}
        {!isHorizontal && product.countInStock <= 10 && product.countInStock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            آخر {product.countInStock} قطع
          </div>
        )}
      </div>
    )
  };

    const { addItem } = useCartStore();
    const { toast } = useToast();
  const { setIsLoading } = useLoading();

  const handleAddToCart = () => {
    setIsLoading(true);
    try {
      // Generate a unique clientId for the cart item
      const clientId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      addItem({
        clientId,
        product: product.id,
        name: product.name || '',
        slug: product.slug || '',
        price: product.price,
        image: product.images?.[0] || 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image',
        countInStock: product.countInStock,
        color: selectedColor || product.colors?.[0] || 'White',
        size: product.sizes?.[0] || 'M',
        category: product.category,
        requiresMedicalCertificate: product.requiresMedicalCertificate,
        quantity: 1,
      }, 1); // quantity is 1
          toast({
        title: "تمت الإضافة",
        description: `${product.name} تم إضافته إلى السلة`,
          });
    } catch (error) {
          toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const AddButton = ({ isHorizontal = false }: { isHorizontal?: boolean } = {}) => {
    if (hideAddToCart) return null;

    return (
        <button 
          onClick={handleAddToCart}
        disabled={product.countInStock === 0}
        className={`w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium ${
          isHorizontal 
            ? 'py-1 px-2 text-[10px]' 
            : 'py-2 px-4 text-sm'
        }`}
      >
        {product.countInStock === 0 ? "نفذ المخزون" : "أضف للسلة"}
        </button>
    );
  };

    return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${hideBorder ? 'border-0 shadow-none' : ''}`}>
      <CardContent className="p-0">
        {horizontalLayout ? (
          // Horizontal layout for mobile
          <div className="flex flex-col sm:flex-col">
            {/* Mobile: Horizontal layout */}
            <div className="flex sm:hidden h-40">
              {/* Image on the left - 50% width, 100% height */}
              <div className="relative w-1/2 h-full">
                <ProductImage isHorizontal={true} />
                <Link
                  href={`/product/${product.slug}`}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Eye className="h-4 w-4 text-white" />
                </Link>
              </div>
              
              {/* Content on the right - 50% width, centered */}
              <div className="w-1/2 px-3 py-2 space-y-1 flex flex-col justify-center text-center">
                <Link href={`/product/${product.slug}`} className="block space-y-1 flex-1">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight hover:text-orange-600 transition-colors text-center">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <Rating rating={product.avgRating} />
                    <span className="text-xs text-muted-foreground">
                      ({product.numReviews})
                    </span>
                  </div>
                  <div className="text-center">
                    <ProductPrice 
                      price={product.price} 
                      originalPrice={product.listPrice}
                      className="text-sm"
                    />
                  </div>
                </Link>
          
                {showColorSelector && product.colors && product.colors.length > 1 && (
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-muted-foreground">الألوان:</p>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {product.colors.slice(0, 3).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? 'border-orange-500 scale-110'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: getColorValue(color) }}
                          title={color}
                        />
                      ))}
                      {product.colors.length > 3 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{product.colors.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex justify-center">
                  <AddButton isHorizontal={true} />
                </div>
              </div>
            </div>
            
            {/* Desktop: Normal vertical layout */}
            <div className="hidden sm:block">
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative">
                  <ProductImage />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Link>
              
              {!hideDetails && (
                <div className="p-4 space-y-3">
                  <Link href={`/product/${product.slug}`} className="block">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1 hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Rating rating={product.avgRating} />
                        <span className="text-xs text-muted-foreground">
                          ({product.numReviews} تقييم)
                        </span>
                      </div>
                      <ProductPrice 
                        price={product.price} 
                        originalPrice={product.listPrice}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </Link>

                  {showColorSelector && product.colors && product.colors.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">الألوان:</p>
                      <div className="flex gap-2 flex-wrap">
                        {product.colors.slice(0, 4).map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              selectedColor === color
                                ? 'border-orange-500 scale-110'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: getColorValue(color) }}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{product.colors.length - 4}
                          </span>
          )}
        </div>
                    </div>
                  )}

                  <AddButton isHorizontal={false} />
          </div>
        )}
      </div>
          </div>
        ) : (
          // Normal vertical layout
          <div className="flex flex-col">
            <div className="relative">
          <ProductImage />
              <Link
                href={`/product/${product.slug}`}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                <Eye className="h-8 w-8 text-white" />
              </Link>
        </div>
        
        {!hideDetails && (
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Rating rating={product.avgRating} />
                    <span className="text-xs text-muted-foreground">
                      ({product.numReviews} تقييم)
                    </span>
                  </div>
                  <ProductPrice 
                    price={product.price} 
                    originalPrice={product.listPrice}
                    className="text-sm sm:text-base"
                  />
                </div>

                {showColorSelector && product.colors && product.colors.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">الألوان:</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.slice(0, 4).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? 'border-orange-500 scale-110'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: getColorValue(color) }}
                          title={color}
                        />
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{product.colors.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <AddButton isHorizontal={false} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;