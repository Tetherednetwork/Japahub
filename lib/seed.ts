
'use client';
// To run this seed script, open your browser's developer console on any page of this application,
// copy the contents of this file, paste it into the console, and press Enter.
// Then, type `await seedServices()` into the console and press Enter.

import { collection, writeBatch, getFirestore, doc } from 'firebase/firestore';
import { initializeFirebase } from '../firebase';

const sampleServices = [
    {
        name: 'Taste of Lagos',
        category: 'Food & Restaurants',
        description: 'Authentic Nigerian cuisine, specializing in Jollof Rice, Suya, and Pounded Yam. A true taste of home.',
        imageUrl: 'https://images.unsplash.com/photo-1598103442385-0b31d1d130b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMGZvb2R8ZW58MHx8fHwxNzY4MzE1Mjg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 4.8,
        reviewCount: 124,
        isVerified: true,
        phone: '555-123-4567',
        website: 'https://tasteoflagos.example.com',
        address: '123 Main Street, Houston, TX 77002'
    },
    {
        name: 'Ankara Styles by Titi',
        category: 'Fashion & Tailoring',
        description: 'Custom-made traditional and modern ankara outfits for all occasions. Expert tailoring and design consultation.',
        imageUrl: 'https://images.unsplash.com/photo-1622352358362-a8c6a237242d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMGZhc2hpb258ZW58MHx8fHwxNzY4MzE1MzE4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 4.9,
        reviewCount: 88,
        isVerified: true,
        phone: '555-987-6543',
        address: '456 Market Square, Atlanta, GA 30303'
    },
    {
        name: 'Naija Grocers',
        category: 'Grocery & Imports',
        description: 'Your one-stop shop for imported Nigerian food products, spices, and ingredients. From garri to Maggi cubes.',
        imageUrl: 'https://images.unsplash.com/photo-1588964893822-a89b09f7a431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmUlMjBhZnJpY2FufGVufDB8fHx8MTc2ODMxNTM0NHww&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 4.7,
        reviewCount: 210,
        isVerified: false,
        website: 'https://naijagrocers.example.com'
    },
    {
        name: 'Femi\'s Auto Repair',
        category: 'Automotive Services',
        description: 'Reliable and affordable car repair and maintenance services. Specializing in all makes and models.',
        imageUrl: 'https://images.unsplash.com/photo-1599420689033-6d0d9843916e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhdXRvJTIwcmVwYWlyfGVufDB8fHx8MTc2ODMxNTM2N3ww&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 4.6,
        reviewCount: 56,
        isVerified: true,
        phone: '555-222-3333',
        address: '789 Industrial Park, Newark, NJ 07101'
    },
    {
        name: 'Aunty Bola\'s Hair Braiding',
        category: 'Beauty & Salon',
        description: 'Expert hair braiding services including box braids, cornrows, and twists. Walk-ins and appointments welcome.',
        imageUrl: 'https://images.unsplash.com/photo-1621611358994-517a6a4270e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxoYWlyJTIwYnJhaWRpbmd8ZW58MHx8fHwxNzY4MzE1NDM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 4.9,
        reviewCount: 150,
        isVerified: true,
        phone: '555-444-5555'
    },
    {
        name: 'Kayode Legal Services',
        category: 'Legal & Immigration',
        description: 'Professional legal advice on immigration, family law, and business law. Helping the community navigate complex legal issues.',
        imageUrl: 'https://images.unsplash.com/photo-1589216532372-1c2a36790049?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsYXclMjBvZmZpY2V8ZW58MHx8fHwxNzY4MzE1NDYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
        rating: 5.0,
        reviewCount: 32,
        isVerified: true,
        address: '101 Courthouse Plaza, Brooklyn, NY 11201',
        website: 'https://kayodelegal.example.com'
    },
];

export async function seedServices() {
    try {
        const { firestore } = initializeFirebase();
        if (!firestore) {
            console.error("Firestore is not initialized.");
            return;
        }

        const servicesCollection = collection(firestore, 'services');
        const batch = writeBatch(firestore);

        sampleServices.forEach(service => {
            const docRef = doc(collection(firestore, 'services'));
            batch.set(docRef, service);
        });

        await batch.commit();
        console.log(`Successfully seeded ${sampleServices.length} services.`);
        alert(`Successfully seeded ${sampleServices.length} services. Refresh the page to see them.`);

    } catch (error) {
        console.error("Error seeding services:", error);
        alert("Error seeding services. See the console for details.");
    }
}

// Make the function available globally for console access
if (typeof window !== 'undefined') {
    (window as any).seedServices = seedServices;
}
