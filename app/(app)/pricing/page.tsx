// app/(app)/pricing/page.tsx (if you have one, or adapt to your pricing page)
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

export default function PricingPage() {
    const plans = [
        {
            name: "Starter",
            price: "$29",
            features: ["10 generations/mo", "Basic platforms"],
        },
        {
            name: "Pro",
            price: "$79",
            features: [
                "100 generations/mo",
                "All platforms",
                "Priority support",
            ],
        },
        {
            name: "Enterprise",
            price: "Custom",
            features: ["Unlimited", "Dedicated account manager"],
        },
    ];

    return (
        <div className="container mx-auto py-12">
            <h1 className="text-4xl font-bold text-center mb-12">
                Choose Your Plan
            </h1>
            <div className="grid gap-8 md:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="grow">
                            <p className="text-3xl font-mono mb-4">
                                {plan.price}
                            </p>
                            <ul className="space-y-2">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-primary">✓</span>{" "}
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="metallic" className="w-full">
                                Get Started
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
