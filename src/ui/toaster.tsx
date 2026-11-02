import { Toaster as SonnerToaster } from "sonner";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Spinner } from "./spinner";

/** 应用根部挂载的提示容器：白底细边框卡片，左侧语义色图标。 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      offset={20}
      visibleToasts={4}
      icons={{
        success: <CheckCircle2 className="size-4 text-emerald-500" />,
        error: <XCircle className="size-4 text-red-500" />,
        warning: <AlertTriangle className="size-4 text-amber-500" />,
        info: <Info className="size-4 text-sky-500" />,
        loading: <Spinner size={16} />,
      }}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "!min-h-0 !gap-2.5 !rounded-xl !border !border-line !bg-white !px-4 !py-2.5 !font-sans !shadow-pop",
          title: "!text-13 !font-medium !leading-5 !text-slate-800",
          description: "!text-xs !text-slate-500",
          icon: "!m-0 !size-4 !shrink-0",
        },
      }}
    />
  );
}
