import { apiClient } from "@shared/lib/api-client";
import { useMutation } from "@tanstack/react-query";
export const newsletterSignupMutationKey = ["newsletter-signup"];
export const useNewsletterSignupMutation = () => {
    return useMutation({
        mutationKey: newsletterSignupMutationKey,
        mutationFn: async (form) => {
            const response = await apiClient.newsletter.signup.$post({
                form,
            });
            if (!response.ok) {
                throw new Error("Failed to sign up to newsletter");
            }
        },
    });
};
export const contactFormMutationKey = ["contact-form"];
export const useContactFormMutation = () => {
    return useMutation({
        mutationKey: contactFormMutationKey,
        mutationFn: async (form) => {
            const response = await apiClient.contact.$post({
                form,
            });
            if (!response.ok) {
                throw new Error("Failed to send contact form");
            }
        },
    });
};
