
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react';
import { ChevronCompactLeft, ChevronCompactRight } from 'react-bootstrap-icons'


export default function Ilan() {

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
					<div className="post-description">
						<h2 className='title'>Tüm evin badanaya ihtiyacı var!</h2>
						<span className="date">1 gün önce</span>
						<p className='description'>
							Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aperiam dolorem mollitia quaerat magni voluptatem? Natus itaque maxime, earum doloribus temporibus rem vero neque beatae. Odio molestias adipisci ipsa rerum tempore? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aperiam aut cumque nisi sit molestiae debitis consequatur consequuntur nam minus doloremque quis possimus, nemo facilis id sapiente voluptas impedit expedita animi.
						</p>
						<span className="location">Osmangazi Mah. / Yıldırım / Bursa</span>
						<div className="author-container">
							<h2 className='author-name'>Muhammed İrşat Akdeniz</h2>
							<span className='phone-number'>0 (555) 555 55 55 - Cep</span>
							<span className='phone-number'>0 (555) 555 55 55 - İş</span>
							<button className="message-request">Mesaj Gönder</button>
						</div>
						<button className="report-button">Şikayet et</button>
					</div>
				</div>
			</div>
		</Template>
	);
}