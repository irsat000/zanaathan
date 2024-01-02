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
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const npThumbnails = useRef<(HTMLDivElement | null)[]>(formData.selectedImages.map(() => (null)));


    // Get the dragged index and replace the hovered index
    const handleDragEnd = (index: number) => {
        if (hoverIndex.current != null) {
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
        }
        // Reset drag information
        npThumbnails.current.forEach(div => div?.classList.remove('drag-hovered'));
        hoverIndex.current = null;
        setDraggedIndex(null);
    };

    return (
        <div className="np-thumbnail-wrapper">
            {formData.selectedImages.length > 0 ? formData.selectedImages.map((image, index) => {
                return (
                    <div key={index} ref={(div) => npThumbnails.current[index] = div} className={`image-thumbnail ${draggedIndex == index ? 'dragged' : ''}`}
                        draggable="true"
                        onDragStart={() => {
                            setDraggedIndex(index);
                        }}
                        onDragEnter={() => {
                            hoverIndex.current = index;
                            npThumbnails.current.forEach((div, i) => {
                                if (i === index) div?.classList.add('drag-hovered');
                                else div?.classList.remove('drag-hovered')
                            });
                        }}
                        onDragEnd={() => handleDragEnd(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onTouchMove={(e) => {
                            e.preventDefault();
                            // Don't drag unless pressed long enough to turn on draggedIndex
                            if (draggedIndex == null) return;
                            // Get hovered thumbnail
                            const touch = e.touches[0];
                            const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (!touchedElement) return;
                            const wrapper = touchedElement.closest('.image-thumbnail')
                            if (!wrapper) return;
                            // Style to indicate hover and set hoverIndex for onTouchEnd event
                            const touchedIndex = Array.from(npThumbnails.current).findIndex(element => element === wrapper);
                            hoverIndex.current = touchedIndex;
                            npThumbnails.current.forEach((div, i) => {
                                if (i === touchedIndex) div?.classList.add('drag-hovered');
                                else div?.classList.remove('drag-hovered');
                            });
                        }}
                        onTouchEnd={() => handleDragEnd(index)}
                    >
                        <span className="image-size">{(image.size / 1000 / 1000).toFixed(1)} MB</span>
                        <div className="image-wrapper">
                            <img src={URL.createObjectURL(new Blob([image]))} alt={`Image ${index}`} />
                        </div>
                        <button type="button" className="delete" onClick={() => {
                            const updated = { ...formData }
                            updated.selectedImages = updated.selectedImages.filter((img, i) => i !== index)
                            setFormData(updated)
                        }}><XLg /></button>
                    </div>
                )
            }) : <span className='choose-image-warning'>Fotoğraf yok</span>}
        </div>
    )
};