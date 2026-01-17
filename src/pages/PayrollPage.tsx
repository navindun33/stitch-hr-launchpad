import { useState } from "react";
import { Lock } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { YTDSummaryCard } from "@/components/payroll/YTDSummaryCard";
import { PaystubCard } from "@/components/payroll/PaystubCard";
import { YearTabs } from "@/components/ui/YearTabs";

const years = ["2024", "2023", "2022"];

const paystubs = {
  "2024": [
    { month: "October", year: "2024", netPay: "$4,250.00" },
    { month: "September", year: "2024", netPay: "$4,250.00" },
    { month: "August", year: "2024", netPay: "$4,100.00", isAdjusted: true },
    { month: "July", year: "2024", netPay: "$4,250.00" },
  ],
  "2023": [
    { month: "December", year: "2023", netPay: "$4,000.00" },
    { month: "November", year: "2023", netPay: "$4,000.00" },
  ],
  "2022": [
    { month: "December", year: "2022", netPay: "$3,800.00" },
  ],
};

export default function PayrollPage() {
  const [selectedYear, setSelectedYear] = useState("2024");

  const currentPaystubs = paystubs[selectedYear as keyof typeof paystubs] || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Payroll & Paystubs" showBack showHelp />

      <main className="max-w-md mx-auto pb-24">
        {/* YTD Summary Card */}
        <div className="p-4">
          <YTDSummaryCard
            fiscalYear="2024"
            totalNetEarnings="$48,500.00"
            totalDeductions="$12,400.00"
            grossPay="$60,900.00"
            progressPercentage={75}
          />
        </div>

        {/* Year Tabs */}
        <div className="px-4 mb-2">
          <YearTabs
            years={years}
            selected={selectedYear}
            onSelect={setSelectedYear}
          />
        </div>

        {/* Recent Paystubs Section */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <h3 className="text-lg font-bold tracking-tight">Recent Paystubs</h3>
          <span className="text-xs text-muted-foreground font-medium">
            {currentPaystubs.length} Records
          </span>
        </div>

        {/* Paystub List */}
        <div className="px-4 space-y-3">
          {currentPaystubs.map((paystub, index) => (
            <PaystubCard
              key={index}
              {...paystub}
              onDownload={() => console.log("Download", paystub.month)}
            />
          ))}
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 px-8 text-center opacity-60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Lock className="h-3.5 w-3.5" />
            <span>End-to-end encrypted security</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Your financial data is protected using bank-level encryption standards.
            Only you and authorized payroll administrators can access these records.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
