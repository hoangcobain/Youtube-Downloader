"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "./ui/card";
import { supabase } from "../../supabase/supabase";
import { Check } from "lucide-react";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {
    // Handle checkout process
    const handleCheckout = async (priceId: string) => {
        if (!user) {
            // Redirect to login if user is not authenticated
            window.location.href = "/login?redirect=pricing";
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('supabase-functions-create-checkout', {
                body: {
                    price_id: priceId,
                    user_id: user.id,
                    return_url: `${window.location.origin}/dashboard`,
                },
                headers: {
                    'X-Customer-Email': user.email || '',
                }
            });

            if (error) {
                throw error;
            }

            // Redirect to Stripe checkout
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    // Define features based on plan type
    const getPlanFeatures = () => {
        // Check if item and item.name exist before calling toLowerCase()
        const planType = item?.name?.toLowerCase() || '';

        switch (planType) {
            case "free":
                return [
                    "Download in 720p quality",
                    "Convert to MP3",
                    "5 downloads per day",
                    "Basic support"
                ];
            case "premium":
                return [
                    "Download in 1080p quality",
                    "Convert to MP3/MP4",
                    "Unlimited downloads",
                    "No ads",
                    "Priority support",
                    "Batch processing"
                ];
            case "pro":
                return [
                    "Download in 4K quality",
                    "All audio formats",
                    "Unlimited downloads",
                    "No ads",
                    "24/7 Premium support",
                    "Batch processing",
                    "Custom subtitle downloads",
                    "Channel downloads"
                ];
            default:
                return ["Feature 1", "Feature 2", "Feature 3"];
        }
    };

    const features = getPlanFeatures();

    return (
        <Card className={`flex flex-col h-full ${item?.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'}`}>
            {item?.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-32 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-1 rounded-full text-center shadow-lg">
                    Most Popular
                </div>
            )}
            <CardHeader className={`pb-4 ${item?.popular ? 'pt-8' : 'pt-6'}`}>
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">{item?.name || 'Plan'}</CardTitle>
                <CardDescription className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-bold text-gray-900">${item?.amount / 100}</span>
                    <span className="text-gray-600">/{item?.interval}</span>
                </CardDescription>
                <p className="text-sm text-gray-500 mt-2">
                    {!item?.name ? "YouTube downloader subscription" :
                        item.name === "Free"
                            ? "Basic access to YouTube downloads"
                            : item.name === "Premium"
                                ? "Perfect for regular YouTube users"
                                : "Ultimate YouTube downloader experience"}
                </p>
            </CardHeader>
            <CardContent className="flex-grow pb-6">
                <div className="border-t border-gray-200 my-4"></div>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mr-2 mt-0.5">
                                <Check className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
                <Button
                    onClick={async () => {
                        await handleCheckout(item?.id || '')
                    }}
                    className={`w-full py-6 text-lg font-medium transition-all ${item?.popular
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                        : ''
                        }`}
                >
                    {item?.name === "Free" ? "Get Started" : "Subscribe Now"}
                </Button>
            </CardFooter>
        </Card>
    )
}