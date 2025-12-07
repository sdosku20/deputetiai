import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { UserMenu } from "@/components/navigation/UserMenu";

interface PageHeaderProps {
  breadcrumbItems: Array<{
    label: string;
    href?: string;
  }>;
  user?: {
    id: string;
    email: string;
    company_name?: string;
    client_id?: string;
  };
  onLogout?: () => void;
}

export function PageHeader({
  breadcrumbItems,
  user,
  onLogout,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2 px-2 sm:px-0">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center ml-2 sm:ml-4">
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </div>
  );
}
