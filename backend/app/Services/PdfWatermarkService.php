<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;

class PdfWatermarkService
{
    protected string $text;
    protected int $red;
    protected int $green;
    protected int $blue;
    protected int $fontSize;
    protected int $charSpacing;

    public function __construct(
        string $text = 'COMMUNE DE DANGBO',
        int $red = 210,
        int $green = 210,
        int $blue = 210,
        int $fontSize = 79,
        int $charSpacing = 0
    ) {
        $this->text = $text;
        $this->red = $red;
        $this->green = $green;
        $this->blue = $blue;
        $this->fontSize = $fontSize;
        $this->charSpacing = $charSpacing;
    }

    public function hasWatermark(string $path): bool
    {
        $content = file_get_contents($path);
        preg_match_all('/stream(.+?)endstream/s', $content, $m);
        foreach ($m[1] as $stream) {
            $data = @gzuncompress(trim($stream));
            if ($data !== false && str_contains($data, $this->text)) {
                return true;
            }
        }
        return false;
    }

    public function watermark(string $inputPath, ?string $outputPath = null, bool $force = false): string
    {
        if ($outputPath === null) {
            $outputPath = tempnam(sys_get_temp_dir(), 'watermark_') . '.pdf';
        }

        if (!$force && $this->hasWatermark($inputPath)) {
            if ($inputPath !== $outputPath) {
                copy($inputPath, $outputPath);
            }
            return $outputPath;
        }

        $pdf = new class(
            $this->text,
            $this->red,
            $this->green,
            $this->blue,
            $this->fontSize,
            $this->charSpacing
        ) extends Fpdi {
            protected string $wText;
            protected int $wR;
            protected int $wG;
            protected int $wB;
            protected int $wSize;
            protected int $wSpacing;

            public function __construct(string $text, int $r, int $g, int $b, int $size, int $spacing)
            {
                parent::__construct();
                $this->wText = $text;
                $this->wR = $r;
                $this->wG = $g;
                $this->wB = $b;
                $this->wSize = $size;
                $this->wSpacing = $spacing;
            }

            public function applyWatermark(float $pageW, float $pageH): void
            {
                $this->SetFont('Helvetica', '', $this->wSize);
                $this->SetTextColor($this->wR, $this->wG, $this->wB);

                $startX = $pageW * 0.08;
                $startY = $pageH * 0.95;
                $diagAngle = rad2deg(atan($pageH / $pageW));
                $this->rotatedText($startX, $startY, $diagAngle, $this->wText);
            }

            protected function rotatedText(float $x, float $y, float $angle, string $text): void
            {
                $angleRad = deg2rad($angle);
                $cos = cos($angleRad);
                $sin = sin($angleRad);

                $px = $x * $this->k;
                $py = ($this->h - $y) * $this->k;

                $s = sprintf(
                    'BT /F%d %.2F Tf %.4F %.4F %.4F %.4F %.4F %.4F cm %d Tc 0 0 Td (%s) Tj ET',
                    $this->CurrentFont['i'],
                    $this->FontSizePt,
                    $cos, $sin, -$sin, $cos,
                    $px, $py,
                    $this->wSpacing,
                    $this->_escape($text)
                );

                if ($this->ColorFlag) {
                    $s = 'q ' . $this->TextColor . ' ' . $s . ' Q';
                }

                $this->_out($s);
            }
        };

        $pageCount = $pdf->setSourceFile($inputPath);

        for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
            $templateId = $pdf->importPage($pageNo);
            $size = $pdf->getTemplateSize($templateId);

            $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
            $pdf->AddPage($orientation, [$size['width'], $size['height']]);
            $pdf->useTemplate($templateId);

            $pdf->applyWatermark($size['width'], $size['height']);
        }

        $pdf->Output('F', $outputPath);

        return $outputPath;
    }
}
