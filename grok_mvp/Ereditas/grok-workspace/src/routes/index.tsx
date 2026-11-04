import { createFileRoute } from "@tanstack/react-router";
import { Companion } from "@/app/companion";

export const Route = createFileRoute("/")({ component: Companion });
