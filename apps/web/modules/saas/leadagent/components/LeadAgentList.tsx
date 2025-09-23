"use client";

import { formatRelativeTime } from "@saas/utils/timezone";
import { Spinner } from "@shared/components/Spinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
  } from "@ui/components/card"
import { Badge } from "@ui/components/badge"
import {
	BellPlus,
	EditIcon,
	MoreVerticalIcon,
	PlusIcon,
	Trash2Icon,
	BadgeCheckIcon,
	ArrowBigDown,
	ArrowBigUp,
	MessageCircleMore,
	Rss
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AgentSetupDialog } from "./AgentSetup";
import { LeadAgentPagination } from "./LeadAgentPagination";
import { Label } from "@ui/components/label";

export function LeadAgentList({
	categoryId,
	organizationId,
}: { categoryId?: string; organizationId?: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [editOpen, setEditOpen] = useState<boolean>(false);
	const [subscription, setSubscription] = useState<any | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const onEditSuccess = (open: boolean, isReload: boolean) => {
		setEditOpen(open);
		if (isReload) {
			reload();
		}
	};


	const reload = () => {
		queryClient.invalidateQueries({
			queryKey: ["subscription-categories"],
		});
		queryClient.invalidateQueries({
			queryKey: ["total-subscriptions"],
		});
		queryClient.invalidateQueries({ queryKey: ["subscription"] });
	};

	// const { data, isLoading } = useQuery({
	// 	queryKey: ["raddit-list", categoryId, organizationId],
	// 	queryFn: async () => {
	// 		let url = "/api/lead-agent";
	// 		const params = new URLSearchParams();
	// 		if (categoryId) {
	// 			params.append("categoryId", categoryId);
	// 		}
	// 		if (organizationId) {
	// 			params.append("organizationId", organizationId);
	// 		}
	// 		url += `?${params.toString()}`;
	// 		const response = await fetch(url);
	// 		return await response.json(); 
	// 	},
	// });

	const data =  [
			{
				"id": 1,
				"title": "A Comprehensive Guide to Integrating React with Node.js for Full-Stack Web Development: From Project Setup to Deployment Best Practices",
				"selftext": "If you’re looking to build a full-stack web application that combines the dynamic UI capabilities of React with the robust backend functionality of Node.js, this guide will walk you through every step of the process. We’ll start by explaining why React and Node.js make such a powerful pair—React’s component-based architecture simplifies UI development, while Node.js’s non-blocking I/O model ensures efficient server-side performance for handling requests. First, we’ll cover setting up your development environment: installing Node.js and npm, creating a new React app using Create React App, and initializing a Node.js backend with Express. Next, we’ll dive into connecting the two: setting up API endpoints in Express to handle data retrieval and storage (using tools like MongoDB for the database), configuring CORS to allow cross-origin requests between your React frontend and Node.js backend, and testing API calls with Postman or Axios. We’ll also explore state management in React—whether you’re using Context API for simpler apps or Redux for larger projects—and how to fetch and display data from your Node.js server in React components. Finally, we’ll discuss deployment options, including hosting your React app on Netlify or Vercel and your Node.js backend on Heroku or AWS, plus tips for optimizing performance and ensuring security (like validating user inputs and using environment variables for sensitive information). By the end of this guide, you’ll have a fully functional full-stack app and the knowledge to build more complex projects with React and Node.js.",
				"url": "https://www.reddit.com/r/reactjs/comments/10yzj5w/how_to_use_react_with_node_js/",
				"permalink": "/r/reactjs/comments/10yzj5w/how_to_use_react_with_node_js/",
				"author": "dev_enthusiast123",
				"subreddit": "reactjs",
				"ups": 289,
				"downs": 32,
				"score": 257,
				"numComments": 45,
				"createdUtc": 1675209600,
				"created": "2023-02-01T00:00:00.000Z"
			},
			{
				"id": 2,
				"title": "Troubleshooting Common React State Management Issues: How to Fix Race Conditions, Stale State, and Prop Drilling",
				"selftext": "State management is one of the most critical (and often frustrating) parts of React development. Even experienced developers run into issues like race conditions, stale state, or prop drilling—and knowing how to resolve them can save hours of debugging. In this post, we’ll break down each of these common problems, explain why they happen, and share step-by-step solutions. First, let’s tackle race conditions: these occur when multiple API calls or state updates complete in an unexpected order, leading to incorrect data display. For example, if you make two API calls to fetch user data and the second call (for an older user) completes after the first (for a newer user), your UI might show the older data instead of the latest. We’ll show you how to fix this using abort controllers to cancel outdated requests or using state flags to track request status. Next, stale state: this happens when a closure (like a function in a useEffect hook) references an old version of state because React batches state updates. We’ll demonstrate how to use the functional update form of useState (e.g., setCount(prevCount => prevCount + 1)) or useRef to store the latest state value. Then, prop drilling: this is when you pass props through multiple levels of components that don’t need them, just to get the props to a deeply nested component. We’ll explore solutions like using React Context API to share state across components without prop drilling, or using Redux Toolkit for larger apps where you need centralized state management with middleware support. We’ll also include code examples for each scenario, so you can see exactly how to implement these fixes in your own projects. Whether you’re building a small personal app or a large enterprise project, understanding these state management pitfalls and their solutions will help you write cleaner, more reliable React code.",
				"url": "https://www.reddit.com/r/reactjs/comments/110abxy/react_state_management_troubleshooting/",
				"permalink": "/r/reactjs/comments/110abxy/react_state_management_troubleshooting/",
				"author": "react_debugger",
				"subreddit": "reactjs",
				"ups": 455,
				"downs": 64,
				"score": 391,
				"numComments": 87,
				"createdUtc": 1676073600,
				"created": "2023-02-11T00:00:00.000Z"
			},
			{
				"id": 3,
				"title": "Building a Responsive E-Commerce UI with React: Using Material-UI, React Router, and Local Storage for Cart Persistence",
				"selftext": "E-commerce apps require a mix of responsive design, smooth navigation, and reliable data persistence—and React is the perfect framework to build them. In this tutorial, we’ll walk you through creating a responsive e-commerce UI from scratch, using Material-UI for pre-built components, React Router for navigation, and local storage to keep the user’s cart data even after they refresh the page. First, we’ll set up the project: installing Material-UI (including @mui/material, @mui/icons-material, and emotion packages) and React Router. We’ll then create the core components: a Header with a navigation bar and cart icon (that shows the number of items in the cart), a ProductList component that fetches and displays products from a mock API (using Axios), a ProductDetail component that shows individual product info and an “Add to Cart” button, and a Cart component that lists items in the cart, lets users adjust quantities, and calculates the total price. Next, we’ll implement cart functionality: using useState to track the cart state, writing functions to add items (with checks to avoid duplicates), remove items, and update quantities. We’ll then use useEffect to save the cart data to local storage whenever it changes, and load it back into state when the app initializes—ensuring the cart doesn’t reset on refresh. We’ll also focus on responsiveness: using Material-UI’s Grid, Container, and Breakpoint components to ensure the UI looks good on mobile, tablet, and desktop. For example, the ProductList will show 1 product per row on mobile, 2 on tablets, and 4 on desktops. Finally, we’ll add finishing touches like loading spinners for API calls, error messages if the API fails, and a “Checkout” button that redirects to a (mock) checkout page. By the end, you’ll have a functional e-commerce UI that’s responsive, user-friendly, and persists cart data—plus the skills to extend it with features like user authentication or payment integration.",
				"url": "https://www.reddit.com/r/reactjs/comments/111xyzc/react_ecommerce_ui_tutorial/",
				"permalink": "/r/reactjs/comments/111xyzc/react_ecommerce_ui_tutorial/",
				"author": "ecommerce_dev",
				"subreddit": "reactjs",
				"ups": 321,
				"downs": 28,
				"score": 293,
				"numComments": 56,
				"createdUtc": 1677024000,
				"created": "2023-02-22T00:00:00.000Z"
			},
			{
				"id": 4,
				"title": "How to Implement User Authentication in React Apps with Firebase Auth: From Sign-Up to Password Reset",
				"selftext": "User authentication is a must for most React apps—whether you’re building a social media platform, a productivity tool, or an e-commerce site. Firebase Auth makes it easy to add secure authentication without building a backend from scratch, and in this post, we’ll show you how to integrate it into your React app. We’ll cover the full authentication flow: sign-up with email and password, log-in, log-out, password reset, and protecting routes so only authenticated users can access them. First, we’ll set up Firebase: creating a Firebase project in the Firebase Console, enabling Email/Password authentication, and installing the necessary Firebase packages (firebase/app and firebase/auth) in your React app. We’ll then create a Firebase config file to initialize Firebase in your app. Next, we’ll build authentication components: a SignUp component with form fields for email and password (plus validation using react-hook-form or Formik), a Login component that uses Firebase’s signInWithEmailAndPassword method, and a PasswordReset component that sends a reset link to the user’s email via sendPasswordResetEmail. We’ll also create an AuthContext using React Context API to share the user’s authentication state (e.g., whether they’re logged in, their user ID) across all components—this avoids prop drilling and lets any component check the user’s status. Then, we’ll implement protected routes using React Router: creating a PrivateRoute component that checks if the user is authenticated (using the AuthContext) and redirects to the login page if they’re not. We’ll also add a logout button that uses Firebase’s signOut method and updates the AuthContext. Finally, we’ll cover best practices: handling authentication errors (like “email already in use” or “invalid password”) and displaying user-friendly messages, using Firebase’s onAuthStateChanged listener to track the user’s state in real time, and securing sensitive data (like Firebase API keys) with environment variables. By the end of this guide, you’ll have a secure authentication system in your React app and the knowledge to extend it with other Firebase Auth methods (like Google Sign-In or Facebook Login).",
				"url": "https://www.reddit.com/r/reactjs/comments/112abcd/firebase_auth_react_guide/",
				"permalink": "/r/reactjs/comments/112abcd/firebase_auth_react_guide/",
				"author": "auth_expert",
				"subreddit": "reactjs",
				"ups": 512,
				"downs": 73,
				"score": 439,
				"numComments": 92,
				"createdUtc": 1677801600,
				"created": "2023-03-03T00:00:00.000Z"
			},
			{
				"id": 5,
				"title": "Optimizing React App Performance: Lazy Loading, Code Splitting, and Memoization Techniques",
				"selftext": "As React apps grow in size and complexity, performance can start to suffer—slow load times, laggy interactions, and high memory usage can drive users away. The good news is that React provides built-in tools and techniques to optimize performance, and in this post, we’ll break down the most effective ones: lazy loading, code splitting, and memoization. First, let’s explain why performance matters: studies show that users abandon apps that take more than 3 seconds to load, and even small delays can hurt conversion rates. Now, let’s dive into the techniques. **Lazy loading**: This lets you load components only when they’re needed (e.g., when a user navigates to a route or clicks a button) instead of loading all components upfront. We’ll show you how to use React.lazy() and Suspense to lazy load route-based components (e.g., using React Router) and component-based lazy loading (e.g., a modal that only loads when opened). We’ll also include code examples and explain how to add loading spinners with Suspense. **Code splitting**: This is closely related to lazy loading—it splits your app’s bundle into smaller chunks that are loaded on demand. We’ll cover how to use React.lazy() for component-level code splitting and tools like Webpack (or Create React App’s built-in support) for route-level splitting. We’ll also show you how to analyze your bundle size with tools like source-map-explorer to identify large dependencies that can be split. **Memoization**: This prevents unnecessary re-renders of components by caching the results of expensive calculations or component renders. We’ll explain three key React APIs: React.memo() (for memoizing functional components), useMemo() (for caching the results of expensive functions), and useCallback() (for caching function references to prevent child components from re-rendering). We’ll include examples of when to use each—like using useMemo() to calculate a filtered list of data and useCallback() to pass stable function references to child components. We’ll also share common mistakes to avoid, like overusing memoization (which can add overhead) and not optimizing the right components. Finally, we’ll show you how to measure performance improvements using React DevTools’ Profiler tab, so you can see exactly how much faster your app is after applying these techniques. By the end, you’ll have a toolkit of performance optimization strategies to keep your React app fast and responsive—even as it grows.",
				"url": "https://www.reddit.com/r/reactjs/comments/113wxyz/react_performance_optimization/",
				"permalink": "/r/reactjs/comments/113wxyz/react_performance_optimization/",
				"author": "perf_guru",
				"subreddit": "reactjs",
				"ups": 489,
				"downs": 56,
				"score": 433,
				"numComments": 78,
				"createdUtc": 1678579200,
				"created": "2023-03-13T00:00:00.000Z"
			},
			{
				"id": 6,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			}
			,
			{
				"id": 7,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			},
			{
				"id": 8,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			},
			{
				"id": 9,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			},
			{
				"id": 10,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			},
			{
				"id": 11,
				"title": "Using React Query to Simplify Data Fetching: Caching, Refetching, and Error Handling",
				"selftext": "Data fetching in React can be messy—managing loading states, caching data, handling errors, and refetching when data changes often requires writing a lot of boilerplate code. React Query (now part of TanStack Query) solves this problem by providing a declarative API for data fetching that handles caching, refetching, and state management out of the box. In this post, we’ll show you how to use React Query to streamline data fetching in your React app. First, we’ll explain what React Query does: it acts as a “data layer” between your React components and your API, caching responses so you don’t make redundant requests, automatically refetching data when it becomes stale, and providing easy access to loading, error, and success states. We’ll start by setting up React Query: installing @tanstack/react-query, wrapping your app with QueryClientProvider, and creating a QueryClient instance. Next, we’ll cover the core hooks: useQuery() for fetching data (e.g., a list of posts or a single user) and useMutation() for modifying data (e.g., creating, updating, or deleting a post). For useQuery(), we’ll show you how to define a query key (a unique identifier for the data), a query function (that makes the API call), and how to access loading, error, and data states. We’ll also explain caching: how React Query stores data in the cache, how to invalidate the cache when data changes (using useMutation()’s onSuccess option), and how to set stale time and cache time to control when data is refetched. For useMutation(), we’ll demonstrate how to handle loading and error states during the mutation, how to refetch data after the mutation succeeds, and how to rollback changes if the mutation fails. We’ll also cover advanced features like pagination (using useInfiniteQuery()), prefetching data (using queryClient.prefetchQuery()), and deduplicating requests (so multiple components requesting the same data only make one API call). We’ll include code examples for each feature, using Axios for API calls, so you can see exactly how to implement React Query in your own projects. By the end, you’ll be able to replace hundreds of lines of boilerplate data-fetching code with clean, maintainable React Query hooks—and your app will have better performance thanks to caching and optimized refetching.",
				"url": "https://www.reddit.com/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"permalink": "/r/reactjs/comments/114abcde/react_query_data_fetching/",
				"author": "data_fetch_pro",
				"subreddit": "reactjs",
				"ups": 376,
				"downs": 41,
				"score": 335,
				"numComments": 63,
				"createdUtc": 1679356800,
				"created": "2023-03-23T00:00:00.000Z"
			}
		
	]

	const isLoading = false;

	// 分页计算
	const totalItems = data.length;
	const totalPages = Math.ceil(totalItems / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const currentData = data.slice(startIndex, endIndex);

	// 分页状态
	const canPreviousPage = currentPage > 1;
	const canNextPage = currentPage < totalPages;

	// 分页事件处理
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handlePageSizeChange = (size: number) => {
		setPageSize(size);
		setCurrentPage(1); // 重置到第一页
	};
	
	

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">{t("leadAgent.list.title")}</h2>
				<Button
					variant="ghost"
					onClick={() => {
						setEditOpen(true);
						setSubscription(null);
					}}
				>
					<PlusIcon className="size-4" />
					{t("common.actions.new")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-64">
					<Spinner className="mr-2 size-4 text-primary" />
					{t("common.loading")}
				</div>
			) : (
				currentData.map((item: any) => (
					<Link key={item.id} href={item.url} target="_blank" rel="noopener noreferrer">
						<Card className="mb-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
							<CardHeader>
								<div>
								<Label className="ml-auto text-xs text-muted-foreground justify-start">{item.author} · {formatRelativeTime(new Date(item.created))}</Label>
								</div>
								<CardTitle>
									{item.title}
								</CardTitle>
								<CardDescription className="mb-2 overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', lineHeight: '1.5'}}>{item.selftext}</CardDescription>
							</CardHeader>
							<CardFooter>
								<div className="flex w-full flex-wrap gap-2">
									<Badge
									status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
									>
									<ArrowBigUp size={16}/>
									{item.ups}
									</Badge>
									<Badge
									status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
									>
									<ArrowBigDown size={16}/>
									{item.downs}
									</Badge>

									<Badge
									status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums"
									>
									<MessageCircleMore size={16}/>
									{item.numComments}
									</Badge>

									<Badge
									status="info" className="flex h-5 min-w-5 items-center gap-1 rounded-full px-2 font-mono tabular-nums bg-slate-600 text-white normal-case"
									>
									{item.subreddit}
									</Badge>

									
									
									

									
								</div>
							</CardFooter>
						</Card>
					</Link>
				))
			)}
			<LeadAgentPagination
				currentPage={currentPage}
				totalPages={totalPages}
				pageSize={pageSize}
				totalItems={totalItems}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				canPreviousPage={canPreviousPage}
				canNextPage={canNextPage}
			/>
			{<AgentSetupDialog
				open={editOpen}
				categoryId={categoryId}
				organizationId={organizationId}
				subscription={subscription}
				onSuccess={onEditSuccess}
			/>
			}
		</div>
	);
}
