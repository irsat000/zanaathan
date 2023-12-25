import React, { useRef } from "react";
import { useState } from "react";
import { XLg } from "react-bootstrap-icons";


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
    const hoverIndex = useRef<number | null>(null);
    const dragIndicator = useRef<HTMLSpanElement | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Get the dragged index and replace the hovered index
    const handleDragEnd = (index: number) => {
        if (hoverIndex.current == null) return;
        // Make copy
        const updatedImages = [...formData.selectedImages];
        // Get the dragged image
        const [draggedImage] = updatedImages.splice(index, 1);
        // Update the copy
        updatedImages.splice(hoverIndex.current, 0, draggedImage);
        // Update the formData
        setFormData({
            ...formData,
            selectedImages: updatedImages
        });
        // Reset drag information
        hoverIndex.current = null;
        setDraggedIndex(null);
    };

    // Change indicator's order to match with the user's mouse movement
    const handleDragIndicatorOrder = (order: number) => {
        if (!dragIndicator.current) return
        dragIndicator.current.style.order = order.toString()
    }

    return (
        <div className="np-thumbnail-wrapper">
            <span ref={dragIndicator} className={`drag-indicator ${draggedIndex != null ? 'active' : ''}`}></span>
            {formData.selectedImages.length > 0 ? formData.selectedImages.map((image, index) => (
                <div key={index} className={`image-thumbnail ${draggedIndex == index ? 'dragged' : ''}`}
                    style={{ order: index }}
                    draggable="true"
                    onDragStart={() => {
                        setDraggedIndex(index)
                        handleDragIndicatorOrder(index)
                    }}
                    onDragEnter={() => {
                        if (hoverIndex.current !== index) {
                            hoverIndex.current = index
                            handleDragIndicatorOrder(index)
                        }
                    }}
                    onDragEnd={() => handleDragEnd(index)}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <div className="image-wrapper">
                        <img src={URL.createObjectURL(new Blob([image]))} alt={`Image ${index}`} />
                    </div>
                    <button type="button" className="delete" onClick={() => {
                        const updated = { ...formData }
                        updated.selectedImages = updated.selectedImages.filter((img, i) => i !== index)
                        setFormData(updated)
                    }}><XLg /></button>
                </div>
            )) : <span className='choose-image-warning'>Fotoğraf yok</span>}
        </div>
    )
};