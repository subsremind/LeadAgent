import "./globals.css";
import "cropperjs/dist/cropper.css";
export const metadata = {
    title: {
        absolute: "LeadAgent - Application",
        default: "LeadAgent- Application",
        template: "%s | LeadAgent - Application",
    },
};
export default function RootLayout({ children }) {
    return children;
}
