import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

const ExportarPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Exportar Dados</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-6 h-6 text-success" />
              <div>
                <h3 className="font-semibold text-foreground">Escala Mensal</h3>
                <p className="text-sm text-muted-foreground">Exportar escala completa em CSV</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Relatório de Horas</h3>
                <p className="text-sm text-muted-foreground">Banco de horas e extras</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-6 h-6 text-warning" />
              <div>
                <h3 className="font-semibold text-foreground">Funcionários</h3>
                <p className="text-sm text-muted-foreground">Lista completa da equipe</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportarPage;
