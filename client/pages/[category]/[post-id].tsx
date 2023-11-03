
import Template from '@/components/template'
import { formatSecondsAgo, isNullOrEmpty } from '@/utils/helperUtils';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { ChevronCompactLeft, ChevronCompactRight } from 'react-bootstrap-icons'
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


interface PostDetails {
	Id: number;
	Title: string;
	Description: string;
	SecondsAgo: number;
	Images: string[];
	A_Id: number;
	A_Username: string;
	A_FullName: string;
	ContactInfo: string[];
}

export default function PostDetails() {


	const [postDetails, setPostDetails] = useState<PostDetails | null>(null);

	useEffect(() => {
		fetch(`${apiUrl}/get-post-details/1`, {
			method: "GET",
			headers: { 'Content-Type': 'application/json; charset=utf-8' }
		})
			.then(res => res.ok ? res.json() : Promise.reject(res))
			.then((data) => {
				// Sanatize contact information array
				const contactInfoString = data.postDetails.ContactInfo;
				console.log(data.postDetails)
				const contactInfoArray = !isNullOrEmpty(contactInfoString) ? contactInfoString.split(';') : [];
				// Sanatize image links array
				const imagesString = data.postDetails.Images;
				const imagesArray = !isNullOrEmpty(imagesString) ? imagesString.split(';') : [];

				// Create the sanatized object
				const sanatizedPostDetails = { ...data.postDetails };
				sanatizedPostDetails.ContactInfo = contactInfoArray;
				sanatizedPostDetails.Images = imagesArray;

				// Update the postDetails
				setPostDetails(sanatizedPostDetails);
			})
			.catch((res) => console.log('Sunucuda hata'));
	}, []);

	const [activeImage, setActiveImage] = useState(0);
	const carouselRef = useRef<HTMLDivElement | null>(null);

	// Scroll left or right with buttons
	const scrollCarousel = (direction: string) => {
		const carousel = carouselRef.current;
		if (carousel) {
			if (direction === 'left') {
				carousel.scrollBy({ left: -200, behavior: 'smooth' });
			} else {
				carousel.scrollBy({ left: 200, behavior: 'smooth' });
			}
		}
	}


	return (
		<Template>
			<div className='post-page'>
				<div className="post-container">
					<div className="gallery-container">
						<div className="gallery-main">
							<Image src={require('@/assets/site/painter2.jpg')} alt={''} />
						</div>
						<div className="thumbnail-carousel-container">
							<button className='thumbnail-previous' onClick={() => scrollCarousel('left')}>
								<ChevronCompactLeft />
							</button>
							<div className="thumbnail-carousel" ref={carouselRef}>
								{[...Array(8)].map((a, i) =>
									<div className={`thumbnail-wrapper ${i === activeImage && 'active'}`}
										key={i}
										onClick={() => setActiveImage(i)}
									>
										<Image src={require('@/assets/site/painter2.jpg')} alt={''} />
										<span className='active-sign'></span>
									</div>
								)}
							</div>
							<button className='thumbnail-next' onClick={() => scrollCarousel('right')}>
								<ChevronCompactRight />
							</button>
						</div>
					</div>
					<div className='post-details'>
						<div className='author-container'>
							<h2 className='author-name'>{postDetails?.A_FullName ?? postDetails?.A_Username}</h2>
							{postDetails?.ContactInfo.map((info, i) =>
								<span key={i} className='contact-information'>{info}</span>
							)}
							<div className='author-actions'>
								<button className='message-request'>Mesaj Gönder</button>
								<button className='report-button'>Şikayet et</button>
							</div>
						</div>
						<h2 className='title'>{postDetails?.Title}</h2>
						<span className="date">{postDetails ? formatSecondsAgo(postDetails.SecondsAgo) : <></>}</span>
						<span className='location'>Yıldırım / Bursa</span>
					</div>
				</div>
				<div className='post-description'>
					<h2 className='description-heading'>Açıklama</h2>
					<p className='description'>
						{postDetails?.Description}
					</p>
				</div>
			</div>
		</Template>
	);
}