export const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import categoryList from '@/assets/site/categories.json'

export interface City {
    Id: number;
    Name: string;
}

export interface District {
    Id: number;
    Name: string;
}

export const fetchAndCacheCities = async () => {
    // Check if the data is already cached in local storage
    const cachedCities = localStorage.getItem('cachedCities');
    if (cachedCities) {
        // If cached data exists, parse it and set it in the state
        return JSON.parse(cachedCities) as City[];
    } else {
        return await fetch(`${apiUrl}/get-cities`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                // Cache the data in local storage for future use
                localStorage.setItem('cachedCities', JSON.stringify(data.cities));
                // Set the data in the state
                return data.cities as City[];
            })
            .catch((res) => {
                console.log('Sunucuda hata');
                return null;
            });
    }
}


export const fetchAndCacheDistricts = async (cityId: string, districtsAll: Map<string, District[]>) => {
    // Ignore if city is already mapped or default value of '0'
    if (cityId === '0' || districtsAll.has(cityId)) return null;

    // Check if the data is in localStorage this time
    const cachedData = localStorage.getItem(`cachedDistricts_${cityId}`);
    if (cachedData) {
        // If data is found in localStorage, update the state with the cached data
        const parsedData = JSON.parse(cachedData);
        const updatedDistrictsAll = new Map(districtsAll);
        updatedDistrictsAll.set(cityId, parsedData);
        return updatedDistrictsAll;
    } else {
        return await fetch(`${apiUrl}/get-districts?city_id=${cityId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                // Update the cache in localStorage
                localStorage.setItem(`cachedDistricts_${cityId}`, JSON.stringify(data.districts));
                // Make a copy
                const updatedDistrictsAll = new Map(districtsAll);
                // Assign the new values
                updatedDistrictsAll.set(cityId, data.districts);
                // Update the state
                return updatedDistrictsAll;
            })
            .catch((res) => {
                console.log('Sunucuda hata');
                return null;
            });
    }
}

// Get sub categories from assets by category id
export const getSubsByCategory = (cateId: string) => {
    if (cateId === '0') return [];
    const category = categoryList.find(cate => cate.Id.toString() === cateId);
    return category?.SubCategories ?? [];
}