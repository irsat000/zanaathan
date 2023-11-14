
import Template from '@/components/template'
import { useContacts } from '@/context/contactsContext';
import { useGStatus } from '@/context/globalContext';
import { useUser } from '@/context/userContext';
import { apiUrl, formatSecondsAgo, imageLink, isNullOrEmpty, lowerCaseAllWordsExceptFirstLetters } from '@/lib/utils/helperUtils';
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { ChevronCompactLeft, ChevronCompactRight } from 'react-bootstrap-icons'


interface PostDetails {
	Id: number;
	Title: string;
	Description: string;
	SecondsAgo: number;
	Images: {
		Link: string;
		ImageError: undefined | boolean;
		Loaded: undefined | boolean;
	}[];
	A_Id: number;
	A_Username: string;
	A_FullName: string | null;
	A_Avatar: string | null;
	ContactInfo: string[];
	Location: string;
}

export default function PostDetails() {
	// Get user context
	const { userData } = useUser();
	// User contacts context
	const { userContacts, setUserContacts } = useContacts();
	// General status context
	const { handleGStatus } = useGStatus();

	// Get path
	const router = useRouter();
	const { category, postId } = router.query;
	// Details for the current post
	const [postDetails, setPostDetails] = useState<PostDetails | null>(null);

	useEffect(() => {
		if (!postId) return;

		fetch(`${apiUrl}/get-post-details/${postId}`, {
			method: "GET",
			headers: { 'Content-Type': 'application/json; charset=utf-8' }
		})
			.then(res => res.ok ? res.json() : Promise.reject(res))
			.then((data) => {
				// Sanatize contact information array
				const contactInfoString = data.postDetails.ContactInfo;
				const contactInfoArray = !isNullOrEmpty(contactInfoString) ? contactInfoString.split(';') : [];
				// Sanatize image links array
				const imagesString = data.postDetails.Images;
				const imagesArray = !isNullOrEmpty(imagesString) ? imagesString.split(';').map((link: string) => ({ Link: link })) : [];

				// Create the sanatized object
				const sanatizedPostDetails = { ...data.postDetails };
				sanatizedPostDetails.ContactInfo = contactInfoArray;
				sanatizedPostDetails.Images = imagesArray;

				// Update the postDetails
				setPostDetails(sanatizedPostDetails);
			})
			.catch((res) => console.log('Sunucuda hata'));
	}, [postId]);

	const [activeImage, setActiveImage] = useState(0);


	/*const carouselRef = useRef<HTMLDivElement | null>(null);

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
	}*/

	// Creates a temporary contact with targetId at the start of the contact menu
	// - First message makes it permanent
	const handleMessageRequest = (targetId: number) => {
		if (!userData) return; // TODO: Warn the user about logging in first
		if (targetId === userData.sub) return; // TODO: Warn the user about not being able to send message to yourself
		if (!postDetails) return; // To ignore warning, postDetails is not null in this function
		const receiverIdExists = userContacts.some(contact => contact.ReceiverId === targetId);
		if (!receiverIdExists) {
			const updated = [...userContacts];
			const newContact = {
				ReceiverId: targetId,
				LastMessage: null,
				LastMessageDate: null,
				ReceiverAvatar: postDetails.A_Avatar,
				ReceiverFullName: postDetails.A_FullName,
				ReceiverUsername: postDetails.A_Username,
				CachedThread: []
			}
			updated.unshift(newContact);
			setUserContacts(updated);
		}
		// Open chatbot
		handleGStatus('chatbotActive', true);
		// Select the new contact
		handleGStatus('activeContact', targetId);
	}

	return (
		<Template>
			{postDetails ?
				<div className='post-page'>
					<div className="post-container">
						<div className="gallery-container">
							<div className="gallery-main">
								{postDetails.Images.map((img, i) => img && !img.ImageError ?
									<Image
										className={`${activeImage === i ? 'active' : ''}`}
										loader={() => imageLink(img.Link)}
										unoptimized={true}
										priority={true}
										src={imageLink(img.Link)}
										alt={`İlanın ${i + 1}. fotoğrafı`}
										width={0}
										height={0}
										key={i}
										onError={() => {
											// Set ImageError to true if the image is not found
											const updatedPostDetails = { ...postDetails };
											updatedPostDetails.Images[i].ImageError = true;
											setPostDetails(updatedPostDetails);
										}}
										onLoad={() => {
											// Set Loaded to true if the image is found
											const updatedPostDetails = { ...postDetails };
											updatedPostDetails.Images[i].Loaded = true;
											setPostDetails(updatedPostDetails);
										}} />
									: null
								)}
							</div>
							<div className="thumbnail-carousel-container">
								<div className="thumbnail-carousel">
									{postDetails.Images.map((img, i) => img && img.Loaded && !img.ImageError ?
										<div className={`thumbnail-wrapper ${i === activeImage && 'active'}`}
											key={i}
											onClick={() => setActiveImage(i)}
										>
											<Image
												loader={() => imageLink(img.Link)}
												unoptimized={true}
												priority={false}
												src={imageLink(img.Link)}
												alt={`İlanın ${i + 1}. mini fotoğrafı`}
												width={0}
												height={0}
											/>
											<span className='active-sign'></span>
										</div>
										: null
									)}
								</div>
							</div>
						</div>
						<div className='post-details'>
							<div className='author-container'>
								<h2 className='author-name'>{postDetails.A_FullName ?? postDetails.A_Username}</h2>
								{postDetails.ContactInfo.map((info, i) =>
									<span key={i} className='contact-information'>{info}</span>
								)}
								<div className='author-actions'>
									<button className='message-request' onClick={() => handleMessageRequest(postDetails.A_Id)}>Mesaj Gönder</button>
									<button className='report-button'>Şikayet et</button>
								</div>
							</div>
							<h2 className='title'>{postDetails.Title}</h2>
							<span className="date">{postDetails ? formatSecondsAgo(postDetails.SecondsAgo) : <></>}</span>
							<span className='location'>{lowerCaseAllWordsExceptFirstLetters(postDetails.Location ?? "")}</span>
						</div>
					</div>
					<div className='post-description'>
						<h2 className='description-heading'>Açıklama</h2>
						<p className='description'>
							{postDetails.Description}
						</p>
					</div>
				</div>
				: <>Show no post error</>}
		</Template>
	);
}