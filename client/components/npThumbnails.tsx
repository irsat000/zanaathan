import React from "react";
import { useState } from "react";


export interface NPFormData {
    title: string,
    subCategory: string,
    district: string,
    selectedImages: File[]
}

// np = new post
export const NP_Thumbnails: React.FC<{
    formData: NPFormData,
    setFormData: React.Dispatch<React.SetStateAction<NPFormData>>
}> = ({ formData, setFormData }) => {
    // Drag information
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Get the dragged index and replace the hovered index
    const handleDragEnd = (index: number) => {
        if (hoverIndex == null) return;
        // Make copy
        const updatedImages = [...formData.selectedImages];
        // Get the dragged image
        const [draggedImage] = updatedImages.splice(index, 1);
        // Update the copy
        updatedImages.splice(hoverIndex, 0, draggedImage);
        // Update the formData
        setFormData({
            ...formData,
            selectedImages: updatedImages
        });
        // Reset drag information
        setHoverIndex(null);
        setDraggedIndex(null);
    };

    return (
        <div className="np-thumbnail-wrapper">
            <span className={`drag-indicator ${hoverIndex != null ? 'active' : ''}`} style={{ order: hoverIndex ?? 'unset' }}></span>
            {formData.selectedImages.length > 0 ? formData.selectedImages.map((image, index) => (
                <div key={index} className={`image-thumbnail ${draggedIndex == index ? 'dragged' : ''}`}
                    style={{ order: index }}
                    draggable="true"
                    onDragStart={() => setDraggedIndex(index)}
                    onDragEnter={() => {
                        setHoverIndex(index)
                    }}
                    onDragEnd={() => handleDragEnd(index)}
                >
                    <img src={URL.createObjectURL(new Blob([image]))} alt={`Image ${index}`} />
                </div>
            )) : <span className='choose-image-warning'>Fotoğraf yok</span>}
        </div>
    )
};