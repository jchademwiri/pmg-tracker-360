export function BenefitsSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Proven Results & ROI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organizations using Tender Track 360 see measurable improvements in
            their tender success rates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">40%</div>
            <div className="text-lg font-semibold text-foreground mb-2">
              Higher Success Rate
            </div>
            <p className="text-muted-foreground">
              Average improvement in tender win rate
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-chart-2 mb-2">60%</div>
            <div className="text-lg font-semibold text-foreground mb-2">
              Time Savings
            </div>
            <p className="text-muted-foreground">
              Reduction in administrative overhead
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-chart-5 mb-2">25%</div>
            <div className="text-lg font-semibold text-foreground mb-2">
              Cost Reduction
            </div>
            <p className="text-muted-foreground">
              Lower operational costs per tender
            </p>
          </div>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
          <h3 className="text-2xl font-bold text-card-foreground mb-6 text-center">
            Why Organizations Choose Tender Track 360
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <span className="text-primary text-xl mr-3">✓</span>
              <div>
                <h4 className="font-semibold text-card-foreground">
                  Streamlined Processes
                </h4>
                <p className="text-muted-foreground">
                  Eliminate manual tracking and reduce errors
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-primary text-xl mr-3">✓</span>
              <div>
                <h4 className="font-semibold text-card-foreground">
                  Better Collaboration
                </h4>
                <p className="text-muted-foreground">
                  Keep teams aligned and informed
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-primary text-xl mr-3">✓</span>
              <div>
                <h4 className="font-semibold text-card-foreground">
                  Compliance Assurance
                </h4>
                <p className="text-muted-foreground">
                  Meet all regulatory requirements
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-primary text-xl mr-3">✓</span>
              <div>
                <h4 className="font-semibold text-card-foreground">
                  Data-Driven Insights
                </h4>
                <p className="text-muted-foreground">
                  Make informed decisions with analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
